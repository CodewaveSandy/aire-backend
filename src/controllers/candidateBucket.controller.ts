import { NextFunction, Request, Response } from "express";
import { CandidateBucket } from "../models/candidateBucket.model";
import { successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";

export const createShortlistBucket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: jobId } = req.params;
    const { candidateIds } = req.body;

    logger.info(
      `Creating shortlist bucket for job ${jobId} with candidates ${candidateIds.join(
        ", "
      )}`
    );

    const bucket = await CandidateBucket.create({
      job: jobId,
      createdBy: req.user?._id,
      candidates: candidateIds.map((id: string) => ({
        candidate: id,
        currentStage: "shortlisted",
      })),
    });

    logger.info(`Candidate bucket created: ${bucket._id}`);

    return successResponse(res, bucket, "Candidate bucket created");
  } catch (err) {
    logger.error("Error creating candidate bucket:", err);
    next(err);
  }
};

