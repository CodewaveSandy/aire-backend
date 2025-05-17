"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJobOpening = exports.updateJobOpening = exports.getJobOpeningById = exports.getAllJobOpenings = exports.createJobOpening = void 0;
const jobOpening_model_1 = require("../models/jobOpening.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
// Create job
const createJobOpening = async (req, res, next) => {
    try {
        const job = new jobOpening_model_1.JobOpening(req.body);
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
//# sourceMappingURL=jobOpening.controller.js.map