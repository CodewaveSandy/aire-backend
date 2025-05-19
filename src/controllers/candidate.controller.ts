import { Request, Response, NextFunction } from "express";
import { Candidate } from "../models/candidate.model";
import { successResponse, failedResponse } from "../utils/response.utils";
import { extractEmail, extractName, extractPhone } from "../utils/parser.utils";
import { logger } from "../config/logger";
import fs from "fs";
import textract from "textract";
import pdfParse from "pdf-parse";
import path from "path";

// Create
export const createCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    successResponse(res, candidate, "Candidate created");
  } catch (error) {
    logger.error("Error creating candidate:", error);
    next(error);
  }
};

// Get all (with populated skills + pagination/filter ready)
export const getAllCandidates = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { results, pagination } = res.locals.filteredData;
    const populatedResults = await Candidate.populate(results, {
      path: "skills",
    });
    successResponse(
      res,
      { results: populatedResults, pagination },
      "Candidates retrieved"
    );
  } catch (error) {
    logger.error("Error fetching candidates:", error);
    next(error);
  }
};

// Get one
export const getCandidateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate(
      "skills"
    );
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate found");
  } catch (error) {
    logger.error("Error fetching candidate:", error);
    next(error);
  }
};

// Update
export const updateCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("skills");
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate updated");
  } catch (error) {
    logger.error("Error updating candidate:", error);
    next(error);
  }
};

// Delete
export const deleteCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return failedResponse(res, "Candidate not found");
    successResponse(res, candidate, "Candidate deleted");
  } catch (error) {
    logger.error("Error deleting candidate:", error);
    next(error);
  }
};

// Parsing Resume

export const parseResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.path) {
      failedResponse(res, "No resume file uploaded");
    }

    const filePath = req?.file?.path || "";
    const ext = path.extname(filePath).toLowerCase();

    let extractedText: string;

    if (ext === ".pdf") {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = await new Promise<string>((resolve, reject) => {
        textract.fromFileWithPath(filePath, (err, text) => {
          if (err || !text) return reject(err || new Error("Empty text"));
          resolve(text);
        });
      });
    }

    fs.unlink(filePath, () => {}); // Cleanup uploaded file

    const data = {
      name: extractName(extractedText),
      email: extractEmail(extractedText),
      phone: extractPhone(extractedText),
    };

    successResponse(res, data, "Resume parsed successfully");
  } catch (err) {
    logger.error("Error during resume parsing:", err);
    failedResponse(res, "Failed to parse resume");
    next(err);
  }
};

