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
    model: Skill,
    searchableFields: ["name", "slug"],
    multiValueFields: [],
    defaultSort: "name",
    allowedFields: ["name", "slug", "createdAt"],
    minSearchLength: 2,
  }),
  paginationMiddleware,
  getAllSkills
);
router.get("/:id", getSkillById);
router.put("/:id", authorize("hr"), updateSkill);
router.delete("/:id", authorize("hr"), deleteSkill);

export default router;

