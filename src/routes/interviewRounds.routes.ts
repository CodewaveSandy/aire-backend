import { Router } from "express";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import {
  getInterviewDetails,
  getInterviews,
  scheduleInterviewRound,
  submitInterviewFeedback,
} from "../controllers/interviewRound.controller";

const router = Router();

// Middleware to log skill route accesses
router.use((req, _res, next) => {
  logger.debug(`Interview route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// All routes below require authentication (e.g., HR)
router.use(authMiddleware);

router.get("/", authorize("hr"), getInterviews);
router.get("/:id", authorize("hr", "interviewer"), getInterviewDetails);

router.post("/schedule", authorize("hr"), scheduleInterviewRound);
router.patch(
  "/:id/feedback",
  authorize("interviewer"),
  submitInterviewFeedback
);

export default router;

