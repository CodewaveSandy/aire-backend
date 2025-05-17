"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidate = exports.updateCandidate = exports.getCandidateById = exports.getAllCandidates = exports.createCandidate = void 0;
const candidate_model_1 = require("../models/candidate.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
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
//# sourceMappingURL=candidate.controller.js.map