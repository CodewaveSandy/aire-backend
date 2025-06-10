import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllInterviewers,
} from "../controllers/user.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import { successResponse } from "../utils/response.utils";
import { validate } from "../middleware/validate.middleware";
import { registerUserSchema } from "../validators/user.schema";

const router = Router();

// Log all requests to user routes
router.use((req, _res, next) => {
  logger.debug(`User route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Register a new user
router.post("/register", validate(registerUserSchema), registerUser);

// Login user
router.post("/login", loginUser);

// Get current user (protected route)
router.get("/me", authMiddleware, getCurrentUser);
router.get("/check-auth", authMiddleware, getCurrentUser);
router.get("/interviewers", authMiddleware, getAllInterviewers);

// Example of a protected route with role restriction
router.get("/hr-only", authMiddleware, authorize("hr"), (_req, res) => {
  successResponse(res, { message: "HR only resource" });
});

export default router;

