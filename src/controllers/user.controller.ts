import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../config/logger";
import { createToken, setCookie } from "../utils/jwt.utils";
import { User, IUser } from "../models/user.model";
import { failedResponse, successResponse } from "../utils/response.utils";

// Register a new user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("Registering new user");
    logger.debug("Registration data:", {
      ...req.body,
      password: "***HIDDEN***",
    });

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed: Email already in use: ${email}`);
      failedResponse(res, "Email already in use");
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    // Save user to database
    await user.save();
    const userId = user._id ? user._id.toString() : "unknown";
    logger.info(`User registered successfully: ${userId}`);

    // Return success response with user data
    successResponse(res, user, "User registered successfully");
  } catch (error) {
    logger.error("Error registering user:", error);
    next(error);
  }
};

// User login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("User login attempt");
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      logger.warn("Login failed: Missing email or password");
      failedResponse(res, "Please provide email and password");
      return;
    }

    // Find user with password (for real DB)
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists
    if (!user) {
      logger.warn(`Login failed: No user found with email: ${email}`);
      failedResponse(res, "Invalid email or password");
      return;
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Login failed: Invalid password for user: ${email}`);
      failedResponse(res, "Invalid email or password");
      return;
    }

    // Generate token
    const userId = user._id ? user._id.toString() : "unknown";
    const token = createToken(userId);

    // Set cookie
    setCookie(res, token);

    logger.info(`User logged in successfully: ${userId}`);

    // Return success response with user data
    successResponse(res, user, "Login successful");
  } catch (error) {
    logger.error("Error logging in user:", error);
    next(error);
  }
};

// Get user by ID - used internally
export const getUserById = async (id: string): Promise<IUser | null> => {
  try {
    logger.debug(`Getting user by ID: ${id}`);

    if (!id) {
      logger.warn("No ID provided to getUserById");
      return null;
    }

    return await User.findById(id);
  } catch (error) {
    logger.error(`Error getting user by ID ${id}:`, error);
    return null;
  }
};

// Get current user - protected route
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("Getting current user profile");

    // User should be attached to request by auth middleware
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    successResponse(res, req.user, "User profile retrieved successfully");
  } catch (error) {
    logger.error("Error getting current user:", error);
    next(error);
  }
};

