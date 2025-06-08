"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShortlistBucket = exports.createShortlistBucket = void 0;
const candidateBucket_model_1 = require("../models/candidateBucket.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const mongoose_1 = require("mongoose");
const createShortlistBucket = async (req, res, next) => {
    try {
        const { id: jobId } = req.params;
        const { candidateIds } = req.body;
        logger_1.logger.info(`Creating shortlist bucket for job ${jobId} with candidates ${candidateIds.join(", ")}`);
        const bucket = await candidateBucket_model_1.CandidateBucket.create({
            job: jobId,
            createdBy: req.user?._id,
            candidates: candidateIds.map((id) => ({
                candidate: id,
                currentStage: "shortlisted",
            })),
        });
        logger_1.logger.info(`Candidate bucket created: ${bucket._id}`);
        return (0, response_utils_1.successResponse)(res, bucket, "Candidate bucket created");
    }
    catch (err) {
        logger_1.logger.error("Error creating candidate bucket:", err);
        next(err);
    }
};
exports.createShortlistBucket = createShortlistBucket;
const getShortlistBucket = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        logger_1.logger.info(`Retrieving shortlist bucket for job ${jobId}`);
        const objectIdJob = new mongoose_1.Types.ObjectId(jobId);
        const bucket = await candidateBucket_model_1.CandidateBucket.aggregate([
            { $match: { job: objectIdJob } },
            { $unwind: "$candidates" },
            // Join candidate info
            {
                $lookup: {
                    from: "candidates",
                    localField: "candidates.candidate",
                    foreignField: "_id",
                    as: "candidateData",
                },
            },
            { $unwind: "$candidateData" },
            // Join candidate's skill info
            {
                $lookup: {
                    from: "skills",
                    localField: "candidateData.skills",
                    foreignField: "_id",
                    as: "candidateSkills",
                },
            },
            // Project final structure
            {
                $project: {
                    _id: 0,
                    candidateId: "$candidateData._id",
                    fullName: "$candidateData.fullName",
                    email: "$candidateData.email",
                    experience: "$candidateData.experience",
                    skills: "$candidateSkills",
                    status: "$candidateData.status",
                    currentStage: "$candidates.currentStage",
                    addedAt: "$candidates.addedAt",
                },
            },
        ]);
        logger_1.logger.info(`Shortlist bucket retrieved for job ${jobId}: ${bucket.length} candidates`);
        if (!bucket || bucket.length === 0) {
            logger_1.logger.warn(`No candidate bucket found for job ${jobId}`);
            return (0, response_utils_1.failedResponse)(res, "No candidate bucket found for this job.");
        }
        return (0, response_utils_1.successResponse)(res, bucket, "Shortlisted candidates retrieved (aggregated)");
    }
    catch (err) {
        next(err);
    }
};
exports.getShortlistBucket = getShortlistBucket;
//# sourceMappingURL=candidateBucket.controller.js.map