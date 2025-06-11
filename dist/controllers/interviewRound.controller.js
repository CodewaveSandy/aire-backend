"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterviews = exports.submitInterviewFeedback = exports.scheduleInterviewRound = exports.getInterviewDetails = void 0;
const interviewRound_model_1 = require("../models/interviewRound.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const candidate_model_1 = require("../models/candidate.model");
const meeting_utls_1 = require("../utils/meeting.utls");
const jobOpening_model_1 = require("../models/jobOpening.model");
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
        logger_1.logger.info("Scheduling new interview round");
        const { job, candidate, round, interviewer, scheduledAt, durationMins, mode, } = req.body;
        // 1. Validation
        const existing = await interviewRound_model_1.InterviewRound.findOne({ job, candidate, round });
        if (existing) {
            return (0, response_utils_1.failedResponse)(res, `Round ${round} already scheduled.`);
        }
        const pastRounds = await interviewRound_model_1.InterviewRound.find({ job, candidate });
        if (round > 1 &&
            !pastRounds.some((r) => r.round === round - 1 && r.decision === "proceed")) {
            return (0, response_utils_1.failedResponse)(res, `Previous round incomplete or rejected.`);
        }
        // 2. Get necessary data
        const [interviewerUser, candidateUser, jobData] = await Promise.all([
            user_model_1.User.findById(interviewer),
            candidate_model_1.Candidate.findById(candidate),
            jobOpening_model_1.JobOpening.findById(job),
        ]);
        const hrEmail = "sandy.1997.gamer@gmail.com";
        const attendees = [
            { email: interviewerUser?.email },
            { email: candidateUser?.email },
            { email: hrEmail },
        ].filter(Boolean);
        // 3. Create Zoom meeting if online
        let meetingUrl = "";
        if (mode === "online") {
            const topic = `Interview Round ${round} :: ${jobData?.title} :: ${candidateUser?.fullName}`;
            const description = `Interview Details:\n\n- Round: ${round}\n- Job: ${jobData?.title}\n- Candidate: ${candidateUser?.fullName}\n- Resume: ${candidateUser?.resumeUrl || "N/A"}`;
            meetingUrl = await (0, meeting_utls_1.createZoomMeeting)({
                topic,
                startTime: scheduledAt,
                duration: durationMins,
                agenda: description,
                invitees: attendees,
            });
        }
        // 4. Save interview
        const interview = await interviewRound_model_1.InterviewRound.create({
            job,
            candidate,
            round,
            interviewer,
            scheduledAt,
            durationMins,
            mode,
            interviewUrl: meetingUrl,
            createdBy: req.user?._id,
            organization: req.user?.organization,
        });
        return (0, response_utils_1.successResponse)(res, interview, "Interview scheduled successfully");
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
const getInterviews = async (req, res, next) => {
    try {
        const orgId = req.user?.organization;
        logger_1.logger.info(`Fetching all interviews for organization ${orgId}`);
        if (!orgId) {
            return (0, response_utils_1.failedResponse)(res, "Organization context not found");
        }
        const interviews = await interviewRound_model_1.InterviewRound.aggregate([
            {
                $match: {
                    organization: new mongoose_1.Types.ObjectId(orgId),
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "interviewer",
                    foreignField: "_id",
                    as: "interviewer",
                },
            },
            {
                $unwind: "$interviewer",
            },
            {
                $lookup: {
                    from: "candidates",
                    localField: "candidate",
                    foreignField: "_id",
                    as: "candidate",
                },
            },
            {
                $unwind: "$candidate",
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "candidate.skills",
                    foreignField: "_id",
                    as: "candidate.skills",
                },
            },
            {
                $lookup: {
                    from: "jobopenings",
                    localField: "job",
                    foreignField: "_id",
                    as: "job",
                },
            },
            {
                $unwind: "$job",
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "job.skills",
                    foreignField: "_id",
                    as: "job.skills",
                },
            },
            {
                $project: {
                    round: 1,
                    scheduledAt: 1,
                    durationMins: 1,
                    mode: 1,
                    feedback: 1,
                    score: 1,
                    decision: 1,
                    completedAt: 1,
                    createdBy: 1,
                    createdAt: 1,
                    organization: 1,
                    interviewUrl: 1,
                    interviewer: { name: 1, email: 1, _id: 1 },
                    candidate: {
                        _id: 1,
                        fullName: 1,
                        email: 1,
                        experience: 1,
                        skills: { _id: 1, name: 1, slug: 1 },
                    },
                    job: {
                        _id: 1,
                        title: 1,
                        skills: { _id: 1, name: 1, slug: 1 },
                    },
                },
            },
        ]);
        logger_1.logger.info(`Found ${interviews.length} interviews`);
        return (0, response_utils_1.successResponse)(res, interviews, "All interviews fetched");
    }
    catch (err) {
        logger_1.logger.error("Error fetching interviews:", err);
        next(err);
    }
};
exports.getInterviews = getInterviews;
//# sourceMappingURL=interviewRound.controller.js.map