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
// Create
const createCandidate = async (req, res, next) => {
    try {
        const candidate = new candidate_model_1.Candidate(req.body);
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
            (0, response_utils_1.failedResponse)(res, "No resume file uploaded");
        }
        const filePath = req?.file?.path || "";
        const ext = path_1.default.extname(filePath).toLowerCase();
        let extractedText;
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
        fs_1.default.unlink(filePath, () => { }); // Cleanup uploaded file
        const data = {
            name: (0, parser_utils_1.extractName)(extractedText),
            email: (0, parser_utils_1.extractEmail)(extractedText),
            phone: (0, parser_utils_1.extractPhone)(extractedText),
        };
        (0, response_utils_1.successResponse)(res, data, "Resume parsed successfully");
    }
    catch (err) {
        logger_1.logger.error("Error during resume parsing:", err);
        (0, response_utils_1.failedResponse)(res, "Failed to parse resume");
        next(err);
    }
};
exports.parseResume = parseResume;
//# sourceMappingURL=candidate.controller.js.map