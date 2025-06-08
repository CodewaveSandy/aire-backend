import { NextFunction, Request, Response } from "express";
import { InterviewRound } from "../models/interviewRound.model";
import { successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";

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

    logger.info(`Scheduling interview round ${JSON.stringify(req.body)}`);

    const interview = await InterviewRound.create({
      job,
      candidate,
      round,
      interviewer,
      scheduledAt,
      durationMins,
      mode,
      createdBy: req.user?._id,
    });

    logger.info(`Interview round scheduled: ${interview._id}`);
    return successResponse(res, interview, "Interview scheduled");
  } catch (err) {
    logger.error("Error scheduling interview round:", err);
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

    const interview = await InterviewRound.findByIdAndUpdate(
      id,
      {
        feedback,
        score,
        decision,
        completedAt: new Date(),
      },
      { new: true }
    );

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

