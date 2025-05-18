"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = exports.deleteCandidate = exports.updateCandidate = exports.getCandidateById = exports.getAllCandidates = exports.createCandidate = void 0;
const candidate_model_1 = require("../models/candidate.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
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
        const filePath = req?.file?.path;
        const form = new form_data_1.default();
        form.append("file", fs_1.default.createReadStream(filePath || ""));
        const response = await axios_1.default.post(`${process.env.PARSER_LINK}/parse`, form, {
            headers: {
                ...form.getHeaders(),
                "x-api-key": process.env.PYTHON_API_KEY || "",
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        const { data } = response.data;
        (0, response_utils_1.successResponse)(res, data, "Resume parsed successfully");
    }
    catch (err) {
        logger_1.logger.error("Error calling Python service:", err);
        (0, response_utils_1.failedResponse)(res, "Failed to parse resume via Python service");
        next(err);
    }
};
exports.parseResume = parseResume;
//# sourceMappingURL=candidate.controller.js.map