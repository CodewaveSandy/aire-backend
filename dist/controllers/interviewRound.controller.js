"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnInterviews = exports.getInterviews = exports.submitInterviewFeedback = exports.scheduleInterviewRound = exports.getInterviewDetails = void 0;
const interviewRound_model_1 = require("../models/interviewRound.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const candidate_model_1 = require("../models/candidate.model");
const meeting_utls_1 = require("../utils/meeting.utls");
const jobOpening_model_1 = require("../models/jobOpening.model");
const email_utils_1 = require("../utils/email.utils");
const interviewRound_service_1 = require("../services/interviewRound.service");
const skill_model_1 = require("../models/skill.model");
const getInterviewDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.organization;
        logger_1.logger.info(`Fetching interview details for ${id} in org ${orgId}`);
        if (!orgId) {
            (0, response_utils_1.failedResponse)(res, "Organization context not found");
        }
        const [interview] = await interviewRound_model_1.InterviewRound.aggregate([
            {
                $match: {
                    _id: new mongoose_1.Types.ObjectId(id),
                    organization: new mongoose_1.Types.ObjectId(orgId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "interviewer",
                    foreignField: "_id",
                    as: "interviewer",
                },
            },
            { $unwind: "$interviewer" },
            {
                $lookup: {
                    from: "candidates",
                    localField: "candidate",
                    foreignField: "_id",
                    as: "candidate",
                },
            },
            { $unwind: "$candidate" },
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
            { $unwind: "$job" },
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
                    techSkillScore: 1,
                    softSkillScore: 1,
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
                        resumeUrl: 1,
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
        if (!interview) {
            (0, response_utils_1.failedResponse)(res, "Interview not found");
        }
        const { job, candidate, round } = interview;
        // Step 2: Fetch all previous rounds for this candidate and job
        const previousRounds = await interviewRound_model_1.InterviewRound.find({
            job: job._id,
            candidate: candidate._id,
            organization: orgId,
            round: { $lt: round },
        })
            .select("round feedback score decision techSkillScore softSkillScore completedAt createdBy")
            .sort({ round: 1 })
            .lean();
        // Step 3: Add to response
        // Step 3: Enhance techSkillScore with skill names
        const allSkillIds = new Set();
        for (const round of previousRounds) {
            if (round.techSkillScore) {
                Object.keys(round.techSkillScore).forEach((skillId) => {
                    allSkillIds.add(skillId);
                });
            }
        }
        const skills = await skill_model_1.Skill.find({
            _id: { $in: Array.from(allSkillIds).map((id) => new mongoose_1.Types.ObjectId(id)) },
        })
            .select("_id name")
            .lean();
        const skillMap = {};
        skills.forEach((skill) => {
            skillMap[skill._id.toString()] = { name: skill.name };
        });
        const enrichedPreviousRounds = previousRounds.map((round) => {
            const newTechScore = {};
            if (round.techSkillScore) {
                for (const [skillId, score] of Object.entries(round.techSkillScore)) {
                    const skill = skillMap[skillId];
                    if (skill) {
                        newTechScore[skillId] = {
                            name: skill.name,
                            score,
                        };
                    }
                }
            }
            return {
                ...round,
                techSkillScore: newTechScore,
            };
        });
        const response = {
            ...interview,
            previousRoundsFeedback: enrichedPreviousRounds,
        };
        (0, response_utils_1.successResponse)(res, response, "Interview details fetched");
    }
    catch (err) {
        logger_1.logger.error(`Error fetching interview ${req.params.id}:`, err);
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
        await (0, email_utils_1.sendInterviewEmail)({
            // toAddresses: attendees.map((a) => a.email || ""),
            toAddresses: ["sandip.dhang@yahoo.com"],
            subject: `Interview Round ${round} Scheduled - ${candidateUser?.fullName}`,
            bodyHtml: `<p>Interview for <strong>${candidateUser?.fullName}</strong> is scheduled.</p>
                 <p>Round: ${round}<br/>Mode: ${mode}<br/>Time: ${new Date(scheduledAt).toLocaleString()}<br/>
                 URL: <a href="${interview.interviewUrl}">${interview.interviewUrl}</a></p>`,
            bodyText: `Interview for ${candidateUser?.fullName} is scheduled.\nRound: ${round}\nMode: ${mode}\nTime: ${new Date(scheduledAt).toLocaleString()}\nURL: ${interview.interviewUrl}`,
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
        const { feedback, decision, techSkillScore, softSkillScore } = req.body;
        logger_1.logger.info(`Submitting feedback for interview round ${id}`);
        const interview = await interviewRound_model_1.InterviewRound.findById(id);
        if (!interview) {
            (0, response_utils_1.failedResponse)(res, "Interview not found");
        }
        if (interview?.interviewer.toString() !== req?.user?._id.toString()) {
            (0, response_utils_1.failedResponse)(res, "Only the assigned interviewer can submit feedback");
        }
        const now = new Date();
        const timeDiffMins = (now.getTime() -
            new Date(interview?.scheduledAt || new Date()).getTime()) /
            60000;
        // if (timeDiffMins < 30) {
        //   const remainingMins = Math.max(0, 30 - timeDiffMins);
        //   const hours = Math.floor(remainingMins / 60);
        //   const minutes = Math.round(remainingMins % 60);
        //   const timeLeftMessage =
        //     hours > 0
        //       ? `${hours} hour${hours !== 1 ? "s" : ""} and ${minutes} minute${
        //           minutes !== 1 ? "s" : ""
        //         }`
        //       : `${minutes} minute${minutes !== 1 ? "s" : ""}`;
        //   failedResponse(
        //     res,
        //     `Feedback can only be submitted after 30 minutes of scheduled time. Please wait ${timeLeftMessage}.`
        //   );
        // }
        const score = (0, interviewRound_service_1.calculateInterviewScore)(techSkillScore, softSkillScore);
        Object.assign(interview || {}, {
            feedback,
            techSkillScore: techSkillScore || {},
            softSkillScore: softSkillScore ?? null,
            score,
            decision,
            completedAt: now,
        });
        await interview?.save();
        logger_1.logger.info(`Feedback submitted for interview round ${id}`);
        (0, response_utils_1.successResponse)(res, interview, "Feedback submitted");
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
                        resumeUrl: 1,
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
const getOwnInterviews = async (req, res, next) => {
    try {
        const orgId = req.user?.organization;
        const interviewerId = req.user?._id;
        logger_1.logger.info(`Fetching all interviews for organization ${orgId} and interviewer ${interviewerId}`);
        if (!orgId) {
            return (0, response_utils_1.failedResponse)(res, "Organization context not found");
        }
        const interviews = await interviewRound_model_1.InterviewRound.aggregate([
            {
                $match: {
                    organization: new mongoose_1.Types.ObjectId(orgId),
                    interviewer: new mongoose_1.Types.ObjectId(interviewerId),
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
                        resumeUrl: 1,
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
exports.getOwnInterviews = getOwnInterviews;
//# sourceMappingURL=interviewRound.controller.js.map