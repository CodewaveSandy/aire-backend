"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitInterviewFeedback = exports.scheduleInterviewRound = exports.getInterviewDetails = void 0;
const interviewRound_model_1 = require("../models/interviewRound.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const candidateBucket_model_1 = require("../models/candidateBucket.model");
const getInterviewDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const interview = await interviewRound_model_1.InterviewRound.findById(id)
            .populate("candidate", "fullName email experience skills")
            .populate("interviewer", "name email")
            .populate("job", "title skills")
            .lean();
        if (!interview) {
            return (0, response_utils_1.failedResponse)(res, "Interview not found.");
        }
        return (0, response_utils_1.successResponse)(res, interview, "Interview details fetched");
    }
    catch (err) {
        next(err);
    }
};
exports.getInterviewDetails = getInterviewDetails;
const scheduleInterviewRound = async (req, res, next) => {
    try {
        const { job, candidate, round, interviewer, scheduledAt, durationMins, mode, } = req.body;
        // 1. Check if an interview for this round already exists
        const existing = await interviewRound_model_1.InterviewRound.findOne({
            job,
            candidate,
            round,
        });
        if (existing) {
            return (0, response_utils_1.failedResponse)(res, `Round ${round} interview already scheduled for this candidate.`);
        }
        // 2. Get all past rounds for this candidate/job
        const pastRounds = await interviewRound_model_1.InterviewRound.find({ job, candidate }).sort({
            round: 1,
        });
        // If there are earlier rounds, validate them
        if (round > 1) {
            const previousRound = pastRounds.find((r) => r.round === round - 1);
            if (!previousRound || !previousRound.completedAt) {
                return (0, response_utils_1.failedResponse)(res, `Previous round (${round - 1}) is not yet completed.`);
            }
            if (previousRound.decision !== "proceed") {
                return (0, response_utils_1.failedResponse)(res, `Candidate was not approved in round ${round - 1}.`);
            }
        }
        // 3. Prevent any scheduling if already rejected
        const anyRejected = pastRounds.some((r) => r.decision === "reject");
        if (anyRejected) {
            return (0, response_utils_1.failedResponse)(res, `Candidate has been rejected in a previous round.`);
        }
        // 4. Schedule interview
        const interview = await interviewRound_model_1.InterviewRound.create({
            job,
            candidate,
            round,
            interviewer,
            scheduledAt,
            durationMins,
            mode,
            createdBy: req.user?._id,
        });
        // 🔁 Update candidate stage in CandidateBucket
        await candidateBucket_model_1.CandidateBucket.updateOne({
            job,
            "candidates.candidate": candidate,
        }, {
            $set: {
                "candidates.$.currentStage": "interviewing",
            },
        });
        return (0, response_utils_1.successResponse)(res, interview, "Interview scheduled successfully");
    }
    catch (err) {
        next(err);
    }
};
exports.scheduleInterviewRound = scheduleInterviewRound;
const submitInterviewFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { feedback, score, decision } = req.body;
        logger_1.logger.info(`Submitting feedback for interview round ${id}`);
        const interview = await interviewRound_model_1.InterviewRound.findById(id);
        if (!interview) {
            return (0, response_utils_1.failedResponse)(res, "Interview not found");
        }
        // Rule 1: Only assigned interviewer can submit feedback
        if (interview.interviewer.toString() !== req?.user?._id.toString()) {
            return (0, response_utils_1.failedResponse)(res, "Only the assigned interviewer can submit feedback");
        }
        // Rule 2: Must be at least 30 mins after scheduled time
        const now = new Date();
        const scheduledAt = new Date(interview.scheduledAt);
        const timeDiffMins = (now.getTime() - scheduledAt.getTime()) / (1000 * 60);
        if (timeDiffMins < 30) {
            return (0, response_utils_1.failedResponse)(res, `Feedback can only be submitted after 30 minutes of scheduled time. Please wait ${Math.ceil(30 - timeDiffMins)} more minutes.`);
        }
        // Update feedback
        interview.feedback = feedback;
        interview.score = score;
        interview.decision = decision;
        interview.completedAt = now;
        await interview.save();
        logger_1.logger.info(`Feedback submitted for interview round ${id}`);
        return (0, response_utils_1.successResponse)(res, interview, "Feedback submitted");
    }
    catch (err) {
        logger_1.logger.error(`Error submitting feedback for interview round ${req.params.id}:`, err);
        next(err);
    }
};
exports.submitInterviewFeedback = submitInterviewFeedback;
//# sourceMappingURL=interviewRound.controller.js.map