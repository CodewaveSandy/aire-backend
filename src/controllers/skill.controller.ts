import { Request, Response, NextFunction } from "express";
import { Skill } from "../models/skill.model";
import { logger } from "../config/logger";
import { failedResponse, successResponse } from "../utils/response.utils";
import { findOrCreateSkill } from "../services/skill.service";

export const createSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, aliases } = req.body;

    if (!name || typeof name !== "string") {
      return failedResponse(
        res,
        "Skill name is required and must be a string."
      );
    }

    const skill = await findOrCreateSkill(name, aliases);
    successResponse(res, skill, "Skill created or already exists");
  } catch (error) {
    logger.error("Error creating skill:", error);
    next(error);
  }
};

export const getAllSkills = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hasPagination = !!res.locals.filteredData?.pagination;

    if (hasPagination) {
      const { results, pagination } = res.locals.filteredData;
      successResponse(
        res,
        { results, pagination },
        "Skills retrieved with pagination"
      );
    } else {
      const model = res.locals.model;
      const data = await model
        .find(res.locals.filterQuery || {})
        .sort(res.locals.sortQuery || {})
        .select(res.locals.fieldProjection || "");
      successResponse(res, data, "Skills retrieved");
    }
  } catch (error) {
    logger.error("Error fetching skills:", error);
    next(error);
  }
};

export const updateSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

    const updated = await Skill.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true, runValidators: true }
    );

    if (!updated) return failedResponse(res, "Skill not found");
    successResponse(res, updated, "Skill updated");
  } catch (error) {
    logger.error("Error updating skill:", error);
    next(error);
  }
};

export const deleteSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deleted = await Skill.findByIdAndDelete(id);
    if (!deleted) return failedResponse(res, "Skill not found");
    successResponse(res, deleted, "Skill deleted");
  } catch (error) {
    logger.error("Error deleting skill:", error);
    next(error);
  }
};

export const getSkillById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findById(id);
    if (!skill) return failedResponse(res, "Skill not found");
    successResponse(res, skill, "Skill retrieved");
  } catch (error) {
    logger.error("Error retrieving skill by ID:", error);
    next(error);
  }
};

