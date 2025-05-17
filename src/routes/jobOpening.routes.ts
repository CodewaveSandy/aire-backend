import { Router } from "express";
import {
  createJobOpening,
  getAllJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
} from "../controllers/jobOpening.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { filterMiddleware } from "../middleware/filter.middleware";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { JobOpening } from "../models/jobOpening.model";
import { logger } from "../config/logger";

const router = Router();

router.use(authMiddleware);
router.use((req, _res, next) => {
  logger.debug(`Job route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

router.post("/", authorize("hr"), createJobOpening);

router.get(
  "/",
  filterMiddleware({
    model: JobOpening,
    searchableFields: ["title", "description"],
    multiValueFields: ["skills", "status"],
    allowedFields: [
      "title",
      "minBudget",
      "maxBudget",
      "minExpYear",
      "maxExpYear",
      "status",
    ],
    defaultSort: "createdAt",
  }),
  paginationMiddleware,
  getAllJobOpenings
);

router.get("/:id", getJobOpeningById);
router.put("/:id", authorize("hr"), updateJobOpening);
router.delete("/:id", authorize("hr"), deleteJobOpening);

export default router;

