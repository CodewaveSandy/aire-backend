"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitInterviewFeedback = exports.scheduleInterviewRound = void 0;
const interviewRound_model_1 = require("../models/interviewRound.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const scheduleInterviewRound = async (req, res, next) => {
    try {
        const { job, candidate, round, interviewer, scheduledAt, durationMins, mode, } = req.body;
        logger_1.logger.info(`Scheduling interview round ${JSON.stringify(req.body)}`);
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
        logger_1.logger.info(`Interview round scheduled: ${interview._id}`);
        return (0, response_utils_1.successResponse)(res, interview, "Interview scheduled");
    }
    catch (err) {
        logger_1.logger.error("Error scheduling interview round:", err);
        next(err);
    }
};
exports.scheduleInterviewRound = scheduleInterviewRound;
const submitInterviewFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { feedback, score, decision } = req.body;
        logger_1.logger.info(`Submitting feedback for interview round ${id}`);
        const interview = await interviewRound_model_1.InterviewRound.findByIdAndUpdate(id, {
            feedback,
            score,
            decision,
            completedAt: new Date(),
        }, { new: true });
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