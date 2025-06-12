"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobProgressReport = exports.getRankedCandidates = exports.deleteJobOpening = exports.updateJobOpening = exports.getJobOpeningById = exports.getAllJobOpenings = exports.createJobOpening = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const jobOpening_model_1 = require("../models/jobOpening.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const candidate_model_1 = require("../models/candidate.model");
const jobOpenings_service_1 = require("../services/jobOpenings.service");
const candidateBucket_model_1 = require("../models/candidateBucket.model");
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
        logger_1.logger.info(`Fetching ranked candidates for job ID: ${jobId}`);
        if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
            logger_1.logger.warn(`Invalid job ID format: ${jobId}`);
            return (0, response_utils_1.failedResponse)(res, "Invalid job ID");
        }
        const job = (await jobOpening_model_1.JobOpening.findById(jobId)
            .populate("skills")
            .lean());
        logger_1.logger.info(`Job found: ${job ? job.title : "Not found"}`);
        if (!job) {
            return (0, response_utils_1.failedResponse)(res, "Job not found");
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        logger_1.logger.info(`Fetching candidates for organization: ${job.organization} created after ${sixMonthsAgo.toISOString()}`);
        const candidates = (await candidate_model_1.Candidate.find({
            organization: job.organization,
            status: "active",
            createdAt: { $gte: sixMonthsAgo },
        })
            .populate("skills")
            .lean());
        logger_1.logger.info(`Found ${candidates.length} candidates for ranking`);
        const ranked = (0, jobOpenings_service_1.rankCandidatesByJobSkills)(job.skills, candidates);
        logger_1.logger.info(`Ranked candidates count: ${ranked.length}`);
        const top20 = ranked.slice(0, 20);
        logger_1.logger.info(`Top ${top20.length} candidates selected for AI matching`);
        // Prepare anonymized payload
        const anonymized = top20.map((c, i) => ({
            id: `C-${i}`,
            skills: c.skills.map((s) => s.name),
            experience: c.experience,
            location: c.location,
        }));
        logger_1.logger.info(`Anonymized candidates prepared for AI matching: ${anonymized.length}`);
        const matchedIndexes = await (0, jobOpenings_service_1.suggestWithOpenAI)({
            job,
            candidates: anonymized,
        });
        logger_1.logger.info(`AI-matched candidates indexes: ${matchedIndexes ? matchedIndexes.length : 0}`);
        if (matchedIndexes && matchedIndexes.length > 0) {
            const refined = matchedIndexes.map((i) => top20[i]).filter(Boolean);
            logger_1.logger.info(`Refined candidates after AI matching: ${refined.length}`);
            return (0, response_utils_1.successResponse)(res, refined, "Top 10 AI-matched candidates");
        }
        logger_1.logger.warn("No AI matches found, falling back to top 20 candidates");
        // fallback
        return (0, response_utils_1.successResponse)(res, top20, "Fallback to top 20 locally ranked candidates");
    }
    catch (err) {
        next(err);
    }
};
exports.getRankedCandidates = getRankedCandidates;
const getJobProgressReport = async (req, res, next) => {
    try {
        const jobId = new mongoose_1.Types.ObjectId(req.params.id);
        const bucketData = await candidateBucket_model_1.CandidateBucket.aggregate([
            { $match: { job: jobId } },
            { $unwind: "$candidates" },
            {
                $lookup: {
                    from: "candidates",
                    localField: "candidates.candidate",
                    foreignField: "_id",
                    as: "candidateDetails",
                },
            },
            { $unwind: "$candidateDetails" },
            {
                $lookup: {
                    from: "skills",
                    localField: "candidateDetails.skills",
                    foreignField: "_id",
                    as: "candidateDetails.skills",
                },
            },
            {
                $lookup: {
                    from: "interviewrounds",
                    let: {
                        jobId: "$job",
                        candidateId: "$candidates.candidate",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$job", "$$jobId"] },
                                        { $eq: ["$candidate", "$$candidateId"] },
                                    ],
                                },
                            },
                        },
                        { $sort: { round: 1 } },
                        {
                            $lookup: {
                                from: "users",
                                localField: "interviewer",
                                foreignField: "_id",
                                as: "interviewer",
                            },
                        },
                        { $unwind: "$interviewer" },
                        { $unset: "interviewer.password" }, // 👈 remove password explicitly
                        {
                            $addFields: {
                                interviewer: {
                                    _id: "$interviewer._id",
                                    name: "$interviewer.name",
                                    email: "$interviewer.email",
                                },
                            },
                        },
                    ],
                    as: "interviewRounds",
                },
            },
            {
                $project: {
                    _id: 0,
                    candidateId: "$candidateDetails._id",
                    fullName: "$candidateDetails.fullName",
                    email: "$candidateDetails.email",
                    experience: "$candidateDetails.experience",
                    skills: "$candidateDetails.skills",
                    currentStage: "$candidates.currentStage",
                    interviewRounds: 1,
                    addedAt: "$candidates.addedAt",
                },
            },
            { $sort: { addedAt: -1 } },
        ]);
        if (!bucketData) {
            return (0, response_utils_1.successResponse)(res, [], "No progress found for this job");
        }
        return (0, response_utils_1.successResponse)(res, bucketData, "Job progress retrieved successfully");
    }
    catch (err) {
        next(err);
    }
};
exports.getJobProgressReport = getJobProgressReport;
//# sourceMappingURL=jobOpening.controller.js.map