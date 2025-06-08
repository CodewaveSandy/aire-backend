import { Router } from "express";
import {
  createJobOpening,
  getAllJobOpenings,
  getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
  getRankedCandidates,
  getJobProgressReport,
} from "../controllers/jobOpening.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { filterMiddleware } from "../middleware/filter.middleware";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { JobOpening } from "../models/jobOpening.model";
import { logger } from "../config/logger";
import {
  createShortlistBucket,
  getShortlistBucket,
} from "../controllers/candidateBucket.controller";

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
router.get("/:id/suggestions", authorize("hr"), getRankedCandidates);
router.get("/:id/progress", authorize("hr"), getJobProgressReport);
router.post("/:id/shortlist", authorize("hr"), createShortlistBucket);
router.get("/:id/shortlist", authorize("hr"), getShortlistBucket);

export default router;

