import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/user.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import { successResponse } from "../utils/response.utils";

const router = Router();

// Log all requests to user routes
router.use((req, _res, next) => {
  logger.debug(`User route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Register a new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get current user (protected route)
router.get("/me", authMiddleware, getCurrentUser);

// Example of a protected route with role restriction
router.get("/hr-only", authMiddleware, authorize("hr"), (_req, res) => {
  successResponse(res, { message: "HR only resource" });
});

export default router;

