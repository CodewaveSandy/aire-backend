import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/candidate.model";
import { successResponse, failedResponse } from "../utils/response.utils";
import {
  escapeRegExp,
  extractEmail,
  extractName,
  extractPhone,
  extractRelevantSections,
} from "../utils/parser.utils";
import { logger } from "../config/logger";
import fs from "fs";
import textract from "textract";
import pdfParse from "pdf-parse";
import path from "path";
import { openai } from "../config/openai";
import { resolveSkillsFromText } from "../services/skill.service";
import mongoose from "mongoose";
import { OrgSkill } from "../models/orgSkill.model";
import { uploadToS3 } from "../utils/s3.utils";

// Create
export const createCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let resumeUrl;

    if (req.file) {
      logger.info("Uploading resume to S3...");
      resumeUrl = await uploadToS3(req.file, req.body.fullName);
      // Cleanup local file
      await fs.unlink(req.file.path, (err) => {
        if (err) logger.error("Failed to delete temp file:", err);
      });
    }

    const candidate = new Candidate({
      ...req.body,
      organization: new mongoose.Types.ObjectId(req.user?.organization || ""),
      resumeUrl,
    });

    await candidate.save();
    successResponse(res, candidate, "Candidate created");
  } catch (error) {
    logger.error("Error creating candidate:", error);
    next(error);
  }
};

// Get all (with populated skills + pagination/filter ready)
export const getAllCandidates = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { results, pagination } = res.locals.filteredData;
    const populatedResults = await Candidate.populate(results, {
      path: "skills",
    });
    successResponse(
      res,
      { results: populatedResults, pagination },
      "Candidates retrieved"
    );
  } catch (error) {
    logger.error("Error fetching candidates:", error);
    next(error);
  }
};

// Get one
export const getCandidateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate(
      "skills"
    );
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate found");
  } catch (error) {
    logger.error("Error fetching candidate:", error);
    next(error);
  }
};

// Update
export const updateCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("skills");
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate updated");
  } catch (error) {
    logger.error("Error updating candidate:", error);
    next(error);
  }
};

// Delete
export const deleteCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate deleted");
  } catch (error) {
    logger.error("Error deleting candidate:", error);
    next(error);
  }
};

// Parsing Resume
export const parseResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.path) {
      logger.warn("No resume file uploaded");
      failedResponse(res, "No resume file uploaded");
    }

    const filePath = req?.file?.path || "";
    const ext = path.extname(filePath).toLowerCase();
    let extractedText = "";

    logger.info(`Parsing resume from file: ${filePath} (type: ${ext})`);

    // Step 1: Extract raw text
    if (ext === ".pdf") {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = await new Promise<string>((resolve, reject) => {
        textract.fromFileWithPath(filePath, (err, text) => {
          if (err || !text) return reject(err || new Error("Empty text"));
          resolve(text);
        });
      });
    }

    logger.info("Text extraction complete. Cleaning up uploaded file.");
    fs.unlink(filePath, () => {}); // Cleanup uploaded file

    // Step 2: Extract personal info
    const name = extractName(extractedText);
    const email = extractEmail(extractedText);
    const phone = extractPhone(extractedText);

    console.log({ extractedText });

    logger.info(
      `Extracted personal info - Name: ${name || "N/A"}, Email: ${
        email || "N/A"
      }, Phone: ${phone || "N/A"}`
    );

    // Step 3: Anonymize
    let anonymizedText = extractedText;
    if (name)
      anonymizedText = anonymizedText.replace(
        new RegExp(name, "gi"),
        "[REDACTED_NAME]"
      );
    if (email)
      anonymizedText = anonymizedText.replace(
        new RegExp(escapeRegExp(email), "gi"),
        "[REDACTED_EMAIL]"
      );
    if (phone) {
      const escapedPhone = escapeRegExp(phone);
      anonymizedText = anonymizedText.replace(
        new RegExp(escapedPhone, "gi"),
        "[REDACTED_PHONE]"
      );
    }

    // Step 4: Extract relevant content for OpenAI
    // const relevantResumeText = extractRelevantSections(anonymizedText);
    logger.info("Relevant sections extracted for OpenAI prompt.");

    const prompt = `You are an expert resume parser. 

From the resume content below, extract and return the following details in **strict JSON format**:

- "skills": An array of technical or professional skills. Include only programming languages, frameworks, developer tools, APIs, cloud platforms, databases, or technologies used in projects. 
  ❌ Exclude: Soft skills, general terms like "frontend development", behavioral traits, or duplicate aliases (e.g., both "NodeJs" and "Node.js").

- "experienceInYears": Total professional experience in years, as a decimal string (e.g. "2", "3.5"). Estimate if not explicitly mentioned.

- "about": A 1–2 sentence summary describing the candidate’s technical background, experience, and expertise. Focus on tech stack and what they’ve built.

- "location": City and state (or country) mentioned in contact details or profile summary.

- "education": Highest degree completed (e.g., "Bachelor's", "Master's", "PhD", "Diploma"). Use standardized terms even if the full degree title is long.

Return ONLY a valid JSON object in the following format:
{
  "skills": [...],
  "experienceInYears": "...",
  "about": "...",
  "location": "...",
  "education": "..."
}

Do NOT include any markdown formatting, backticks, explanation, or commentary.

Resume Text:
"""
${anonymizedText}
"""`;

    console.log({ prompt, anonymizedText });
    // Step 5: Send to OpenAI
    logger.info("Sending prompt to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    // const completion = {
    //   choices: [
    //     {
    //       message: {
    //         content: JSON.stringify({
    //           skills: ["JavaScript", "Node.js", "React"],
    //           experienceInYears: "5",
    //           about:
    //             "Experienced full-stack developer with a focus on JavaScript technologies.",
    //           location: "San Francisco, CA",
    //           education: "Bachelor's",
    //         }),
    //       },
    //     },
    //   ],
    // };

    const aiReply = completion.choices[0]?.message?.content || "{}";
    logger.info("OpenAI response received.");

    const cleanedJson = aiReply
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    console.log({ cleanedJson });

    let parsedJson: {
      skills: string[];
      experienceInYears: string;
      about: string;
      location: string;
      education: string;
    };
    try {
      parsedJson = JSON.parse(cleanedJson);
    } catch (err) {
      logger.warn("Failed to parse OpenAI response. Defaulting to empty data.");
      parsedJson = {
        skills: [],
        experienceInYears: "0",
        about: "",
        location: "",
        education: "",
      };
    }

    // Step 6: Resolve skills to DB
    logger.info(
      `Resolving ${parsedJson.skills.length} skills against database...`
    );
    const resolvedSkills = await resolveSkillsFromText(parsedJson.skills || []);
    await Promise.all(
      resolvedSkills.map((skill) =>
        OrgSkill.findOneAndUpdate(
          { organization: req.user?.organization, skill: skill._id },
          { isActive: true },
          { upsert: true, new: true }
        )
      )
    );
    const result = {
      name,
      email,
      phone,
      skills: resolvedSkills,
      experienceInYears: parsedJson.experienceInYears || "0",
      about: parsedJson.about || "",
      location: parsedJson.location || "",
      education: parsedJson.education || "",
    };

    logger.info("Resume parsing completed successfully.");
    successResponse(
      res,
      result,
      "Resume parsed and skills resolved successfully"
    );
  } catch (err) {
    logger.error("Error during resume parsing:", err);
    failedResponse(res, "Failed to parse resume");
    next(err);
  }
};

