import { Request, Response, NextFunction } from "express";
import { Skill } from "../models/skill.model";
import { logger } from "../config/logger";
import { failedResponse, successResponse } from "../utils/response.utils";
import { findOrCreateSkill } from "../services/skill.service";
import { OrgSkill } from "../models/orgSkill.model";
import { slugify } from "../utils/common.utils";
import { Types } from "mongoose";
import { PopulatedOrgSkill } from "../types";

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
    const orgSkill = await OrgSkill.findOneAndUpdate(
      { organization: req.user?.organization, skill: skill._id },
      { isActive: true },
      { new: true, upsert: true }
    ).lean();

    const flattened = {
      ...orgSkill,
      _id: skill._id,
      name: skill.name,
      slug: skill.slug,
      aliases: skill.aliases,
    };

    successResponse(res, flattened, "Skill created or already exists");
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
    const orgId = req.user?.organization;
    if (!orgId) {
      return failedResponse(res, "Organization context not found.");
    }

    const hasPagination = !!res.locals.filteredData?.pagination;
    const queryType = res.locals.queryType;
    const model = res.locals.model;

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const skip = (page - 1) * limit;

    if (queryType === "aggregate") {
      const pipeline = [
        ...res.locals.pipeline,
        { $match: { organization: new Types.ObjectId(orgId), isActive: true } },
        { $skip: skip },
        { $limit: limit },
      ];

      const countPipeline = [
        ...res.locals.pipeline,
        { $match: { organization: new Types.ObjectId(orgId), isActive: true } },
        { $count: "total" },
      ];

      const [rawResults, countResult] = await Promise.all([
        model.aggregate(pipeline),
        model.aggregate(countPipeline),
      ]);

      const totalCount = countResult[0]?.total || 0;

      const results = (rawResults as PopulatedOrgSkill[]).map(
        ({ skill, ...orgSkill }) => ({
          ...orgSkill,
          skillId: skill?._id,
          ...skill,
        })
      );

      return successResponse(
        res,
        {
          results,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
          },
        },
        "Skills retrieved with aggregation and pagination"
      );
    } else {
      const baseFilter = {
        ...res.locals.filterQuery,
        organization: orgId,
        isActive: true,
      };

      if (hasPagination) {
        const { sortQuery, fieldProjection } = res.locals;

        const [rawResults, totalCount] = await Promise.all([
          model
            .find(baseFilter)
            .sort(sortQuery || {})
            .skip(skip)
            .limit(limit)
            .populate("skill")
            .select(fieldProjection || "")
            .lean(),
          model.countDocuments(baseFilter),
        ]);

        const results = (rawResults as PopulatedOrgSkill[]).map(
          ({ skill, ...orgSkill }) => ({
            ...orgSkill,
            skillId: skill?._id,
            ...skill,
          })
        );

        return successResponse(
          res,
          {
            results,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalCount / limit),
              totalCount,
            },
          },
          "Skills retrieved with pagination"
        );
      } else {
        const rawData = await model
          .find(baseFilter)
          .sort(res.locals.sortQuery || {})
          .populate("skill")
          .select(res.locals.fieldProjection || "")
          .lean();

        const data = (rawData as PopulatedOrgSkill[]).map(
          ({ skill, ...orgSkill }) => ({
            ...orgSkill,
            skillId: skill?._id,
            ...skill,
          })
        );

        return successResponse(res, data, "Skills retrieved");
      }
    }
  } catch (error) {
    logger.error("Error fetching org-specific skills:", error);
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
    const deleted = await OrgSkill.findByIdAndUpdate(
      { skill: id, organization: req.user?.organization },
      { isActive: false },
      { new: true }
    );
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

