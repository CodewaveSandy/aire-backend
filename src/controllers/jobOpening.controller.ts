import { Request, Response, NextFunction } from "express";
import { JobOpening } from "../models/jobOpening.model";
import { successResponse, failedResponse } from "../utils/response.utils";
import { logger } from "../config/logger";

// Create job
export const createJobOpening = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = new JobOpening(req.body);
    await job.save();
    successResponse(res, job, "Job opening created");
  } catch (error) {
    logger.error("Error creating job opening:", error);
    next(error);
  }
};

// Get all jobs with skills populated
export const getAllJobOpenings = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { results, pagination } = res.locals.filteredData;

    // ✅ Populate 'skills' manually after pagination
    const populatedResults = await JobOpening.populate(results, {
      path: "skills",
    });

    successResponse(
      res,
      { results: populatedResults, pagination },
      "Job openings retrieved"
    );
  } catch (error) {
    logger.error("Error fetching job openings:", error);
    next(error);
  }
};

// Get job by ID
export const getJobOpeningById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = await JobOpening.findById(req.params.id).populate("skills");
    if (!job) return failedResponse(res, "Job opening not found");
    successResponse(res, job, "Job opening found");
  } catch (error) {
    logger.error("Error fetching job opening:", error);
    next(error);
  }
};

// Update job
export const updateJobOpening = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { minBudget, maxBudget, minExpYear, maxExpYear } = req.body;

    // ✅ Manual field relationship validation
    if (
      maxBudget !== undefined &&
      minBudget !== undefined &&
      maxBudget < minBudget
    ) {
      return failedResponse(
        res,
        "maxBudget must be greater than or equal to minBudget"
      );
    }

    if (
      maxExpYear !== undefined &&
      minExpYear !== undefined &&
      maxExpYear < minExpYear
    ) {
      return failedResponse(
        res,
        "maxExpYear must be greater than or equal to minExpYear"
      );
    }

    // ✅ Perform update
    const job = await JobOpening.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) return failedResponse(res, "Job opening not found");

    // ✅ Populate skills after update
    const populatedJob = await job.populate("skills");

    successResponse(res, populatedJob, "Job opening updated");
  } catch (error) {
    logger.error("Error updating job opening:", error);
    next(error);
  }
};

// Delete job
export const deleteJobOpening = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = await JobOpening.findByIdAndDelete(req.params.id);
    if (!job) return failedResponse(res, "Job opening not found");
    successResponse(res, job, "Job opening deleted");
  } catch (error) {
    logger.error("Error deleting job opening:", error);
    next(error);
  }
};

