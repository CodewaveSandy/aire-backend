import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/candidate.model";
import { successResponse, failedResponse } from "../utils/response.utils";
import {
  escapeRegExp,
  extractEmail,
  extractName,
  extractPhone,
  extractRelevantSections,
  extractTextFromFile,
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
import * as mammoth from "mammoth";
import { transformText } from "../utils/common.utils";

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

    // Step 1: Extract raw text
    const filePath = req?.file?.path || "";
    const ext = path.extname(filePath).toLowerCase();
    logger.info(`Parsing resume from file: ${filePath} (type: ${ext})`);
    const extractedText = await extractTextFromFile(filePath);

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
        new RegExp(escapeRegExp(name), "gi"),
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

    const prompt = `You are an expert resume parser. The resume may belong to any domain, not just tech.

From the text below, extract the following in **strict JSON format**:

- "skills": List of professional, technical, or domain-specific skills (tools, platforms, methods, software, certifications). Exclude soft skills or personality traits.

- "experienceInYears": Count professional experience in **decimal years** based on actual job start and end dates found in the resume. 
   - Use the earliest listed job start date and latest listed job end date (or current year if listed as "Present").
   - Output must be the number of years (e.g., "21.1").

- "about": 1–2 sentences describing the candidate’s career background, industries, and strengths.

- "location": City and state (or country) found in job locations or contact info.

- "education": The **highest academic qualification** mentioned (e.g., "Bachelor of Arts in Marketing", "Diploma in Mechanical Engineering", "Certificate in Data Analytics"). Keep the full degree title as written in the resume.

Return **only** a valid JSON object like:
{
  "skills": [...],
  "experienceInYears": "...",
  "about": "...",
  "location": "...",
  "education": "..."
}

Do NOT include explanations, markdown, or extra commentary.

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
    console.log({ resolvedSkills });
    const result = {
      name: transformText(name || "", "capitalize"),
      email: transformText(email || "", "lowercase"),
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

