import { NextFunction, Request, Response } from "express";
import { InterviewRound } from "../models/interviewRound.model";
import { failedResponse, successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";
import { CandidateBucket } from "../models/candidateBucket.model";
import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Candidate } from "../models/candidate.model";
import { createZoomMeeting } from "../utils/meeting.utls";
import { JobOpening } from "../models/jobOpening.model";
import { sendInterviewEmail } from "../utils/email.utils";
import { calculateInterviewScore } from "../services/interviewRound.service";

export const getInterviewDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    logger.info(`Fetching interview details for ${id} in org ${orgId}`);

    if (!orgId) {
      failedResponse(res, "Organization context not found");
    }

    const [interview] = await InterviewRound.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          organization: new Types.ObjectId(orgId),
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
      failedResponse(res, "Interview not found");
    }

    successResponse(res, interview, "Interview details fetched");
  } catch (err) {
    logger.error(`Error fetching interview ${req.params.id}:`, err);
    next(err);
  }
};

export const scheduleInterviewRound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Scheduling new interview round");
    const {
      job,
      candidate,
      round,
      interviewer,
      scheduledAt,
      durationMins,
      mode,
    } = req.body;

    // 1. Validation
    const existing = await InterviewRound.findOne({ job, candidate, round });
    if (existing) {
      return failedResponse(res, `Round ${round} already scheduled.`);
    }

    const pastRounds = await InterviewRound.find({ job, candidate });
    if (
      round > 1 &&
      !pastRounds.some((r) => r.round === round - 1 && r.decision === "proceed")
    ) {
      return failedResponse(res, `Previous round incomplete or rejected.`);
    }

    // 2. Get necessary data
    const [interviewerUser, candidateUser, jobData] = await Promise.all([
      User.findById(interviewer),
      Candidate.findById(candidate),
      JobOpening.findById(job),
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
      const description = `Interview Details:\n\n- Round: ${round}\n- Job: ${
        jobData?.title
      }\n- Candidate: ${candidateUser?.fullName}\n- Resume: ${
        candidateUser?.resumeUrl || "N/A"
      }`;

      meetingUrl = await createZoomMeeting({
        topic,
        startTime: scheduledAt,
        duration: durationMins,
        agenda: description,
        invitees: attendees as { email: string }[],
      });
    }

    // 4. Save interview
    const interview = await InterviewRound.create({
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

    await sendInterviewEmail({
      // toAddresses: attendees.map((a) => a.email || ""),
      toAddresses: ["sandip.dhang@yahoo.com"],
      subject: `Interview Round ${round} Scheduled - ${candidateUser?.fullName}`,
      bodyHtml: `<p>Interview for <strong>${
        candidateUser?.fullName
      }</strong> is scheduled.</p>
                 <p>Round: ${round}<br/>Mode: ${mode}<br/>Time: ${new Date(
        scheduledAt
      ).toLocaleString()}<br/>
                 URL: <a href="${interview.interviewUrl}">${
        interview.interviewUrl
      }</a></p>`,
      bodyText: `Interview for ${
        candidateUser?.fullName
      } is scheduled.\nRound: ${round}\nMode: ${mode}\nTime: ${new Date(
        scheduledAt
      ).toLocaleString()}\nURL: ${interview.interviewUrl}`,
    });

    return successResponse(res, interview, "Interview scheduled successfully");
  } catch (err) {
    logger.error("Error scheduling interview round:", err);
    next(err);
  }
};

export const submitInterviewFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback, decision, techSkillScore, softSkillScore } = req.body;

    logger.info(`Submitting feedback for interview round ${id}`);

    const interview = await InterviewRound.findById(id);
    if (!interview) {
      failedResponse(res, "Interview not found");
    }

    if (interview?.interviewer.toString() !== req?.user?._id.toString()) {
      failedResponse(res, "Only the assigned interviewer can submit feedback");
    }

    const now = new Date();
    const timeDiffMins =
      (now.getTime() -
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

    const score = calculateInterviewScore(techSkillScore, softSkillScore);

    Object.assign(interview || {}, {
      feedback,
      techSkillScore: techSkillScore || {},
      softSkillScore: softSkillScore ?? null,
      score,
      decision,
      completedAt: now,
    });

    await interview?.save();

    logger.info(`Feedback submitted for interview round ${id}`);
    successResponse(res, interview, "Feedback submitted");
  } catch (err) {
    logger.error(
      `Error submitting feedback for interview round ${req.params.id}:`,
      err
    );
    next(err);
  }
};

export const getInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orgId = req.user?.organization;

    logger.info(`Fetching all interviews for organization ${orgId}`);

    if (!orgId) {
      return failedResponse(res, "Organization context not found");
    }

    const interviews = await InterviewRound.aggregate([
      {
        $match: {
          organization: new Types.ObjectId(orgId),
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

    logger.info(`Found ${interviews.length} interviews`);

    return successResponse(res, interviews, "All interviews fetched");
  } catch (err) {
    logger.error("Error fetching interviews:", err);
    next(err);
  }
};

export const getOwnInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orgId = req.user?.organization;
    const interviewerId = req.user?._id;

    logger.info(
      `Fetching all interviews for organization ${orgId} and interviewer ${interviewerId}`
    );

    if (!orgId) {
      return failedResponse(res, "Organization context not found");
    }

    const interviews = await InterviewRound.aggregate([
      {
        $match: {
          organization: new Types.ObjectId(orgId),
          interviewer: new Types.ObjectId(interviewerId),
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

    logger.info(`Found ${interviews.length} interviews`);

    return successResponse(res, interviews, "All interviews fetched");
  } catch (err) {
    logger.error("Error fetching interviews:", err);
    next(err);
  }
};

