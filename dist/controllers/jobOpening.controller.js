"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankedCandidates = exports.deleteJobOpening = exports.updateJobOpening = exports.getJobOpeningById = exports.getAllJobOpenings = exports.createJobOpening = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jobOpening_model_1 = require("../models/jobOpening.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const candidate_model_1 = require("../models/candidate.model");
const jobOpenings_service_1 = require("../services/jobOpenings.service");
// Create job
const createJobOpening = async (req, res, next) => {
    try {
        const job = new jobOpening_model_1.JobOpening({
            ...req.body,
            organization: new mongoose_1.default.Types.ObjectId(req.user?.organization || ""),
        });
        await job.save();
        (0, response_utils_1.successResponse)(res, job, "Job opening created");
    }
    catch (error) {
        logger_1.logger.error("Error creating job opening:", error);
        next(error);
    }
};
exports.createJobOpening = createJobOpening;
// Get all jobs with skills populated
const getAllJobOpenings = async (_req, res, next) => {
    try {
        const { results, pagination } = res.locals.filteredData;
        // ✅ Populate 'skills' manually after pagination
        const populatedResults = await jobOpening_model_1.JobOpening.populate(results, {
            path: "skills",
        });
        (0, response_utils_1.successResponse)(res, { results: populatedResults, pagination }, "Job openings retrieved");
    }
    catch (error) {
        logger_1.logger.error("Error fetching job openings:", error);
        next(error);
    }
};
exports.getAllJobOpenings = getAllJobOpenings;
// Get job by ID
const getJobOpeningById = async (req, res, next) => {
    try {
        const job = await jobOpening_model_1.JobOpening.findById(req.params.id).populate("skills");
        if (!job)
            return (0, response_utils_1.failedResponse)(res, "Job opening not found");
        (0, response_utils_1.successResponse)(res, job, "Job opening found");
    }
    catch (error) {
        logger_1.logger.error("Error fetching job opening:", error);
        next(error);
    }
};
exports.getJobOpeningById = getJobOpeningById;
// Update job
const updateJobOpening = async (req, res, next) => {
    try {
        const { minBudget, maxBudget, minExpYear, maxExpYear } = req.body;
        // ✅ Manual field relationship validation
        if (maxBudget !== undefined &&
            minBudget !== undefined &&
            maxBudget < minBudget) {
            return (0, response_utils_1.failedResponse)(res, "maxBudget must be greater than or equal to minBudget");
        }
        if (maxExpYear !== undefined &&
            minExpYear !== undefined &&
            maxExpYear < minExpYear) {
            return (0, response_utils_1.failedResponse)(res, "maxExpYear must be greater than or equal to minExpYear");
        }
        // ✅ Perform update
        const job = await jobOpening_model_1.JobOpening.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!job)
            return (0, response_utils_1.failedResponse)(res, "Job opening not found");
        // ✅ Populate skills after update
        const populatedJob = await job.populate("skills");
        (0, response_utils_1.successResponse)(res, populatedJob, "Job opening updated");
    }
    catch (error) {
        logger_1.logger.error("Error updating job opening:", error);
        next(error);
    }
};
exports.updateJobOpening = updateJobOpening;
// Delete job
const deleteJobOpening = async (req, res, next) => {
    try {
        const job = await jobOpening_model_1.JobOpening.findByIdAndDelete(req.params.id);
        if (!job)
            return (0, response_utils_1.failedResponse)(res, "Job opening not found");
        (0, response_utils_1.successResponse)(res, job, "Job opening deleted");
    }
    catch (error) {
        logger_1.logger.error("Error deleting job opening:", error);
        next(error);
    }
};
exports.deleteJobOpening = deleteJobOpening;
// Get job suggestions
const getRankedCandidates = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
            return (0, response_utils_1.failedResponse)(res, "Invalid job ID");
        }
        const job = (await jobOpening_model_1.JobOpening.findById(jobId)
            .populate("skills")
            .lean());
        if (!job) {
            return (0, response_utils_1.failedResponse)(res, "Job not found");
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const candidates = (await candidate_model_1.Candidate.find({
            organization: job.organization,
            status: "active",
            createdAt: { $gte: sixMonthsAgo },
        })
            .populate("skills")
            .lean());
        const ranked = (0, jobOpenings_service_1.rankCandidatesByJobSkills)(job.skills, candidates);
        (0, response_utils_1.successResponse)(res, ranked, "Matched candidates ranked successfully");
    }
    catch (err) {
        next(err);
    }
};
exports.getRankedCandidates = getRankedCandidates;
//# sourceMappingURL=jobOpening.controller.js.map