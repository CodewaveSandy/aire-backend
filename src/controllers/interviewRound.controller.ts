import { NextFunction, Request, Response } from "express";
import { InterviewRound } from "../models/interviewRound.model";
import { failedResponse, successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";
import { CandidateBucket } from "../models/candidateBucket.model";
import { Types } from "mongoose";

export const getInterviewDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const interview = await InterviewRound.findById(id)
      .populate("candidate", "fullName email experience skills")
      .populate("interviewer", "name email")
      .populate("job", "title skills")
      .lean();

    if (!interview) {
      return failedResponse(res, "Interview not found.");
    }

    return successResponse(res, interview, "Interview details fetched");
  } catch (err) {
    next(err);
  }
};

export const scheduleInterviewRound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      job,
      candidate,
      round,
      interviewer,
      scheduledAt,
      durationMins,
      mode,
    } = req.body;

    // 1. Check if an interview for this round already exists
    const existing = await InterviewRound.findOne({
      job,
      candidate,
      round,
    });

    if (existing) {
      return failedResponse(
        res,
        `Round ${round} interview already scheduled for this candidate.`
      );
    }

    // 2. Get all past rounds for this candidate/job
    const pastRounds = await InterviewRound.find({ job, candidate }).sort({
      round: 1,
    });

    // If there are earlier rounds, validate them
    if (round > 1) {
      const previousRound = pastRounds.find((r) => r.round === round - 1);

      if (!previousRound || !previousRound.completedAt) {
        return failedResponse(
          res,
          `Previous round (${round - 1}) is not yet completed.`
        );
      }

      if (previousRound.decision !== "proceed") {
        return failedResponse(
          res,
          `Candidate was not approved in round ${round - 1}.`
        );
      }
    }

    // 3. Prevent any scheduling if already rejected
    const anyRejected = pastRounds.some((r) => r.decision === "reject");
    if (anyRejected) {
      return failedResponse(
        res,
        `Candidate has been rejected in a previous round.`
      );
    }

    // 4. Schedule interview
    const interview = await InterviewRound.create({
      job,
      candidate,
      round,
      interviewer,
      scheduledAt,
      durationMins,
      mode,
      organization: req.user?.organization,
      createdBy: req.user?._id,
      interviewUrl:
        req.body.interviewUrl || "https://meet.google.com/fyx-wwqm-pmr",
    });

    // 🔁 Update candidate stage in CandidateBucket
    await CandidateBucket.updateOne(
      {
        job,
        "candidates.candidate": candidate,
      },
      {
        $set: {
          "candidates.$.currentStage": "interviewing",
        },
      }
    );

    return successResponse(res, interview, "Interview scheduled successfully");
  } catch (err) {
    next(err);
  }
};

export const submitInterviewFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { feedback, score, decision } = req.body;

    logger.info(`Submitting feedback for interview round ${id}`);

    const interview = await InterviewRound.findById(id);

    if (!interview) {
      return failedResponse(res, "Interview not found");
    }

    // Rule 1: Only assigned interviewer can submit feedback
    if (interview.interviewer.toString() !== req?.user?._id.toString()) {
      return failedResponse(
        res,
        "Only the assigned interviewer can submit feedback"
      );
    }

    // Rule 2: Must be at least 30 mins after scheduled time
    const now = new Date();
    const scheduledAt = new Date(interview.scheduledAt);
    const timeDiffMins = (now.getTime() - scheduledAt.getTime()) / (1000 * 60);

    if (timeDiffMins < 30) {
      return failedResponse(
        res,
        `Feedback can only be submitted after 30 minutes of scheduled time. Please wait ${Math.ceil(
          30 - timeDiffMins
        )} more minutes.`
      );
    }

    // Update feedback
    interview.feedback = feedback;
    interview.score = score;
    interview.decision = decision;
    interview.completedAt = now;
    await interview.save();

    logger.info(`Feedback submitted for interview round ${id}`);

    return successResponse(res, interview, "Feedback submitted");
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

    logger.info(`Found ${interviews.length} interviews`);

    return successResponse(res, interviews, "All interviews fetched");
  } catch (err) {
    logger.error("Error fetching interviews:", err);
    next(err);
  }
};

