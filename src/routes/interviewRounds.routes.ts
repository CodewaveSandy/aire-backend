import { Router } from "express";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import {
  getInterviewDetails,
  getInterviews,
  getOwnInterviews,
  scheduleInterviewRound,
  submitInterviewFeedback,
} from "../controllers/interviewRound.controller";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { InterviewRound } from "../models/interviewRound.model";
import { filterMiddleware } from "../middleware/filter.middleware";

const router = Router();

// Middleware to log skill route accesses
router.use((req, _res, next) => {
  logger.debug(`Interview route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// All routes below require authentication (e.g., HR)
router.use(authMiddleware);

router.get("/", authorize("hr"), getInterviews);
router.get("/me", authorize("hr", "interviewer"), getOwnInterviews);
router.get("/:id", authorize("hr", "interviewer"), getInterviewDetails);

router.post("/schedule", authorize("hr"), scheduleInterviewRound);
router.patch(
  "/:id/feedback",
  authorize("interviewer"),
  submitInterviewFeedback
);

export default router;

