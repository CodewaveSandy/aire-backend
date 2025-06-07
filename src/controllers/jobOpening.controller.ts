import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { JobOpening } from "../models/jobOpening.model";
import { successResponse, failedResponse } from "../utils/response.utils";
import { logger } from "../config/logger";
import { CandidateWithSkills, JobWithSkills } from "../types";
import { Candidate } from "../models/candidate.model";
import {
  rankCandidatesByJobSkills,
  suggestWithOpenAI,
} from "../services/jobOpenings.service";

// Create job
export const createJobOpening = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = new JobOpening({
      ...req.body,
      organization: new mongoose.Types.ObjectId(req.user?.organization || ""),
    });
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

// Get job suggestions
export const getRankedCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobId = req.params.id;

    logger.info(`Fetching ranked candidates for job ID: ${jobId}`);
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      logger.warn(`Invalid job ID format: ${jobId}`);
      return failedResponse(res, "Invalid job ID");
    }

    const job = (await JobOpening.findById(jobId)
      .populate("skills")
      .lean()) as JobWithSkills | null;

    logger.info(`Job found: ${job ? job.title : "Not found"}`);

    if (!job) {
      return failedResponse(res, "Job not found");
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    logger.info(
      `Fetching candidates for organization: ${
        job.organization
      } created after ${sixMonthsAgo.toISOString()}`
    );

    const candidates = (await Candidate.find({
      organization: job.organization,
      status: "active",
      createdAt: { $gte: sixMonthsAgo },
    })
      .populate("skills")
      .lean()) as CandidateWithSkills[];

    logger.info(`Found ${candidates.length} candidates for ranking`);
    const ranked = rankCandidatesByJobSkills(job.skills, candidates);

    logger.info(`Ranked candidates count: ${ranked.length}`);
    const top20 = ranked.slice(0, 20);
    logger.info(`Top ${top20.length} candidates selected for AI matching`);

    // Prepare anonymized payload
    const anonymized = top20.map((c, i) => ({
      id: `C-${i}`,
      skills: c.skills.map((s) => s.name),
      experience: c.experience,
      location: c.location,
    }));
    logger.info(
      `Anonymized candidates prepared for AI matching: ${anonymized.length}`
    );

    const matchedIndexes = await suggestWithOpenAI({
      job,
      candidates: anonymized,
    });

    logger.info(
      `AI-matched candidates indexes: ${
        matchedIndexes ? matchedIndexes.length : 0
      }`
    );

    if (matchedIndexes && matchedIndexes.length > 0) {
      const refined = matchedIndexes.map((i) => top20[i]).filter(Boolean);

      logger.info(`Refined candidates after AI matching: ${refined.length}`);
      return successResponse(res, refined, "Top 10 AI-matched candidates");
    }

    logger.warn("No AI matches found, falling back to top 20 candidates");

    // fallback
    return successResponse(
      res,
      top20,
      "Fallback to top 20 locally ranked candidates"
    );
  } catch (err) {
    next(err);
  }
};

