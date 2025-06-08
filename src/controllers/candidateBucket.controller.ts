import { NextFunction, Request, Response } from "express";
import { CandidateBucket } from "../models/candidateBucket.model";
import { failedResponse, successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";
import { Types } from "mongoose";

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

export const getShortlistBucket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobId = req.params.id;

    logger.info(`Retrieving shortlist bucket for job ${jobId}`);

    const objectIdJob = new Types.ObjectId(jobId);

    const bucket = await CandidateBucket.aggregate([
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
    logger.info(
      `Shortlist bucket retrieved for job ${jobId}: ${bucket.length} candidates`
    );

    if (!bucket || bucket.length === 0) {
      logger.warn(`No candidate bucket found for job ${jobId}`);
      return failedResponse(res, "No candidate bucket found for this job.");
    }

    return successResponse(
      res,
      bucket,
      "Shortlisted candidates retrieved (aggregated)"
    );
  } catch (err) {
    next(err);
  }
};

