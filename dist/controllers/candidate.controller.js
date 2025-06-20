"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = exports.deleteCandidate = exports.updateCandidate = exports.getCandidateById = exports.getAllCandidates = exports.createCandidate = void 0;
const candidate_model_1 = require("../models/candidate.model");
const response_utils_1 = require("../utils/response.utils");
const parser_utils_1 = require("../utils/parser.utils");
const logger_1 = require("../config/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_1 = require("../config/openai");
const skill_service_1 = require("../services/skill.service");
const mongoose_1 = __importDefault(require("mongoose"));
const orgSkill_model_1 = require("../models/orgSkill.model");
const s3_utils_1 = require("../utils/s3.utils");
const common_utils_1 = require("../utils/common.utils");
// Create
const createCandidate = async (req, res, next) => {
    try {
        let resumeUrl;
        if (req.file) {
            logger_1.logger.info("Uploading resume to S3...");
            resumeUrl = await (0, s3_utils_1.uploadToS3)(req.file, req.body.fullName);
            // Cleanup local file
            await fs_1.default.unlink(req.file.path, (err) => {
                if (err)
                    logger_1.logger.error("Failed to delete temp file:", err);
            });
        }
        const candidate = new candidate_model_1.Candidate({
            ...req.body,
            organization: new mongoose_1.default.Types.ObjectId(req.user?.organization || ""),
            resumeUrl,
        });
        await candidate.save();
        (0, response_utils_1.successResponse)(res, candidate, "Candidate created");
    }
    catch (error) {
        logger_1.logger.error("Error creating candidate:", error);
        next(error);
    }
};
exports.createCandidate = createCandidate;
// Get all (with populated skills + pagination/filter ready)
const getAllCandidates = async (_req, res, next) => {
    try {
        const { results, pagination } = res.locals.filteredData;
        const populatedResults = await candidate_model_1.Candidate.populate(results, {
            path: "skills",
        });
        (0, response_utils_1.successResponse)(res, { results: populatedResults, pagination }, "Candidates retrieved");
    }
    catch (error) {
        logger_1.logger.error("Error fetching candidates:", error);
        next(error);
    }
};
exports.getAllCandidates = getAllCandidates;
// Get one
const getCandidateById = async (req, res, next) => {
    try {
        const candidate = await candidate_model_1.Candidate.findById(req.params.id).populate("skills");
        if (!candidate)
            return (0, response_utils_1.failedResponse)(res, "Candidate not found");
        (0, response_utils_1.successResponse)(res, candidate, "Candidate found");
    }
    catch (error) {
        logger_1.logger.error("Error fetching candidate:", error);
        next(error);
    }
};
exports.getCandidateById = getCandidateById;
// Update
const updateCandidate = async (req, res, next) => {
    try {
        const candidate = await candidate_model_1.Candidate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate("skills");
        if (!candidate)
            return (0, response_utils_1.failedResponse)(res, "Candidate not found");
        (0, response_utils_1.successResponse)(res, candidate, "Candidate updated");
    }
    catch (error) {
        logger_1.logger.error("Error updating candidate:", error);
        next(error);
    }
};
exports.updateCandidate = updateCandidate;
// Delete
const deleteCandidate = async (req, res, next) => {
    try {
        const candidate = await candidate_model_1.Candidate.findByIdAndDelete(req.params.id);
        if (!candidate)
            return (0, response_utils_1.failedResponse)(res, "Candidate not found");
        (0, response_utils_1.successResponse)(res, candidate, "Candidate deleted");
    }
    catch (error) {
        logger_1.logger.error("Error deleting candidate:", error);
        next(error);
    }
};
exports.deleteCandidate = deleteCandidate;
// Parsing Resume
const parseResume = async (req, res, next) => {
    try {
        if (!req.file || !req.file.path) {
            logger_1.logger.warn("No resume file uploaded");
            (0, response_utils_1.failedResponse)(res, "No resume file uploaded");
        }
        // Step 1: Extract raw text
        const filePath = req?.file?.path || "";
        const ext = path_1.default.extname(filePath).toLowerCase();
        logger_1.logger.info(`Parsing resume from file: ${filePath} (type: ${ext})`);
        const extractedText = await (0, parser_utils_1.extractTextFromFile)(filePath);
        logger_1.logger.info("Text extraction complete. Cleaning up uploaded file.");
        fs_1.default.unlink(filePath, () => { }); // Cleanup uploaded file
        // Step 2: Extract personal info
        const name = (0, parser_utils_1.extractName)(extractedText);
        const email = (0, parser_utils_1.extractEmail)(extractedText);
        const phone = (0, parser_utils_1.extractPhone)(extractedText);
        console.log({ extractedText });
        logger_1.logger.info(`Extracted personal info - Name: ${name || "N/A"}, Email: ${email || "N/A"}, Phone: ${phone || "N/A"}`);
        // Step 3: Anonymize
        let anonymizedText = extractedText;
        if (name)
            anonymizedText = anonymizedText.replace(new RegExp((0, parser_utils_1.escapeRegExp)(name), "gi"), "[REDACTED_NAME]");
        if (email)
            anonymizedText = anonymizedText.replace(new RegExp((0, parser_utils_1.escapeRegExp)(email), "gi"), "[REDACTED_EMAIL]");
        if (phone) {
            const escapedPhone = (0, parser_utils_1.escapeRegExp)(phone);
            anonymizedText = anonymizedText.replace(new RegExp(escapedPhone, "gi"), "[REDACTED_PHONE]");
        }
        // Step 4: Extract relevant content for OpenAI
        // const relevantResumeText = extractRelevantSections(anonymizedText);
        logger_1.logger.info("Relevant sections extracted for OpenAI prompt.");
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
        logger_1.logger.info("Sending prompt to OpenAI...");
        const completion = await openai_1.openai.chat.completions.create({
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
        logger_1.logger.info("OpenAI response received.");
        const cleanedJson = aiReply
            .trim()
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/, "")
            .trim();
        console.log({ cleanedJson });
        let parsedJson;
        try {
            parsedJson = JSON.parse(cleanedJson);
        }
        catch (err) {
            logger_1.logger.warn("Failed to parse OpenAI response. Defaulting to empty data.");
            parsedJson = {
                skills: [],
                experienceInYears: "0",
                about: "",
                location: "",
                education: "",
            };
        }
        // Step 6: Resolve skills to DB
        logger_1.logger.info(`Resolving ${parsedJson.skills.length} skills against database...`);
        const resolvedSkills = await (0, skill_service_1.resolveSkillsFromText)(parsedJson.skills || []);
        await Promise.all(resolvedSkills.map((skill) => orgSkill_model_1.OrgSkill.findOneAndUpdate({ organization: req.user?.organization, skill: skill._id }, { isActive: true }, { upsert: true, new: true })));
        console.log({ resolvedSkills });
        const result = {
            name: (0, common_utils_1.transformText)(name || "", "capitalize"),
            email: (0, common_utils_1.transformText)(email || "", "lowercase"),
            phone,
            skills: resolvedSkills,
            experienceInYears: parsedJson.experienceInYears || "0",
            about: parsedJson.about || "",
            location: parsedJson.location || "",
            education: parsedJson.education || "",
        };
        logger_1.logger.info("Resume parsing completed successfully.");
        (0, response_utils_1.successResponse)(res, result, "Resume parsed and skills resolved successfully");
    }
    catch (err) {
        logger_1.logger.error("Error during resume parsing:", err);
        (0, response_utils_1.failedResponse)(res, "Failed to parse resume");
        next(err);
    }
};
exports.parseResume = parseResume;
//# sourceMappingURL=candidate.controller.js.map