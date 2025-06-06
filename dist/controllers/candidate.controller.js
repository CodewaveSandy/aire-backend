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
const textract_1 = __importDefault(require("textract"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const path_1 = __importDefault(require("path"));
const openai_1 = require("../config/openai");
const skill_service_1 = require("../services/skill.service");
// import { uploadToR2 } from "../utils/r2.utils";
const mongoose_1 = __importDefault(require("mongoose"));
const orgSkill_model_1 = require("../models/orgSkill.model");
// Create
const createCandidate = async (req, res, next) => {
    try {
        let resumeUrl;
        // if (req.file) {
        //   logger.info("Uploading resume to R2...");
        //   resumeUrl = await uploadToR2(req.file, req.body.fullName);
        //   // Cleanup local file
        //   await fs.unlink(req.file.path, (err) => {
        //     if (err) logger.error("Failed to delete temp file:", err);
        //   });
        // }
        const candidate = new candidate_model_1.Candidate({
            ...req.body,
            organization: new mongoose_1.default.Types.ObjectId(req.user?.organization || ""),
            resumeUrl: "https://pub-a93aa22471974b57849917c5e1db78e5.r2.dev/Sandip%20Dhang%20-%20Resume.pdf",
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
        const filePath = req?.file?.path || "";
        const ext = path_1.default.extname(filePath).toLowerCase();
        let extractedText = "";
        logger_1.logger.info(`Parsing resume from file: ${filePath} (type: ${ext})`);
        // Step 1: Extract raw text
        if (ext === ".pdf") {
            const fileBuffer = fs_1.default.readFileSync(filePath);
            const pdfData = await (0, pdf_parse_1.default)(fileBuffer);
            extractedText = pdfData.text;
        }
        else {
            extractedText = await new Promise((resolve, reject) => {
                textract_1.default.fromFileWithPath(filePath, (err, text) => {
                    if (err || !text)
                        return reject(err || new Error("Empty text"));
                    resolve(text);
                });
            });
        }
        logger_1.logger.info("Text extraction complete. Cleaning up uploaded file.");
        fs_1.default.unlink(filePath, () => { }); // Cleanup uploaded file
        // Step 2: Extract personal info
        const name = (0, parser_utils_1.extractName)(extractedText);
        const email = (0, parser_utils_1.extractEmail)(extractedText);
        const phone = (0, parser_utils_1.extractPhone)(extractedText);
        logger_1.logger.info(`Extracted personal info - Name: ${name || "N/A"}, Email: ${email || "N/A"}, Phone: ${phone || "N/A"}`);
        // Step 3: Anonymize
        let anonymizedText = extractedText;
        if (name)
            anonymizedText = anonymizedText.replace(new RegExp(name, "gi"), "[REDACTED_NAME]");
        if (email)
            anonymizedText = anonymizedText.replace(new RegExp(email, "gi"), "[REDACTED_EMAIL]");
        if (phone)
            anonymizedText = anonymizedText.replace(new RegExp(phone, "gi"), "[REDACTED_PHONE]");
        // Step 4: Extract relevant content for OpenAI
        const relevantResumeText = (0, parser_utils_1.extractRelevantSections)(anonymizedText);
        logger_1.logger.info("Relevant sections extracted for OpenAI prompt.");
        const prompt = `From the resume content below, extract the following in strict JSON format:

- An array of technical or professional skills (omit soft skills or general terms like 'frontend development')
- Total professional experience in years (e.g. "3.5", "4")
- Breif description of the candidate's technical expertise that can be use as About summary
- Location
- Highest Education degree level (e.g. "Bachelor's", "Master's", "PhD")

Resume content may include technologies used in projects or mentioned inline. Focus on developer tools, frameworks, libraries, and platforms.

Return ONLY this format:
{
  "skills": [...],
  "experienceInYears": "...",
  about: "...",
  location: "...",
  education: "..."
}

Resume Text:
"""
${relevantResumeText}
"""`;
        // Step 5: Send to OpenAI
        logger_1.logger.info("Sending prompt to OpenAI...");
        const completion = await openai_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
        });
        const aiReply = completion.choices[0]?.message?.content || "{}";
        logger_1.logger.info("OpenAI response received.");
        let parsedJson;
        try {
            parsedJson = JSON.parse(aiReply);
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