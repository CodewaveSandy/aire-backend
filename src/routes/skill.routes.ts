import { Router } from "express";
import {
  createSkill,
  getAllSkills,
  updateSkill,
  deleteSkill,
  getSkillById,
} from "../controllers/skill.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import { filterMiddleware } from "../middleware/filter.middleware";
import { Skill } from "../models/skill.model";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { OrgSkill } from "../models/orgSkill.model";

const router = Router();

// Middleware to log skill route accesses
router.use((req, _res, next) => {
  logger.debug(`Skill route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// All routes below require authentication (e.g., HR)
router.use(authMiddleware);
router.post("/", authorize("hr"), createSkill);
router.get(
  "/",
  filterMiddleware({
    model: OrgSkill,
    searchableFields: ["name", "slug"],
    populateLookups: [
      {
        from: "skills", // MongoDB collection name
        localField: "skill",
        foreignField: "_id",
        as: "skill",
        unwind: true,
      },
    ],
    fieldAliases: {
      name: "skill.name",
      slug: "skill.slug",
    },
    defaultSort: "createdAt",
  }),
  paginationMiddleware,
  getAllSkills
);
router.get("/:id", getSkillById);
router.put("/:id", authorize("hr"), updateSkill);
router.delete("/:id", authorize("hr"), deleteSkill);

export default router;

