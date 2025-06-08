"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortlistBucket = void 0;
const candidateBucket_model_1 = require("../models/candidateBucket.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
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
//# sourceMappingURL=candidateBucket.controller.js.map