import { Request, Response, NextFunction } from "express";
import { Skill } from "../models/skill.model";
import { failedResponse, successResponse } from "../utils/response.utils";
import { logger } from "../config/logger";
import { slugify } from "../utils/common.utils";
import { OrgSkill } from "../models/orgSkill.model";

export const addSkillToOrg = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, aliases = [] } = req.body;
    const orgId = req.user?.organization;

    if (!name || !orgId) {
      return failedResponse(res, "Missing required fields.");
    }

    const slug = slugify(name);

    // Global skill registry
    let skill = await Skill.findOne({ slug });
    if (!skill) {
      skill = await Skill.create({ name, slug, aliases });
    }

    const orgSkill = await OrgSkill.findOneAndUpdate(
      { organization: orgId, skill: skill._id },
      { isActive: true },
      { new: true, upsert: true }
    );

    successResponse(res, orgSkill, "Skill assigned to organization");
  } catch (err) {
    logger.error("Error adding skill to organization:", err);
    next(err);
  }
};

export const getOrgSkills = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orgId = req.user?.organization;

    const skills = await OrgSkill.find({
      organization: orgId,
      isActive: true,
    }).populate("skill");
    successResponse(res, skills, "Skills for organization retrieved");
  } catch (err) {
    logger.error("Error getting organization skills:", err);
    next(err);
  }
};

export const removeOrgSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // OrgSkill _id
    const orgSkill = await OrgSkill.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!orgSkill)
      return failedResponse(res, "Skill not found for this organization");
    successResponse(res, orgSkill, "Skill removed from organization");
  } catch (err) {
    logger.error("Error removing org skill:", err);
    next(err);
  }
};

