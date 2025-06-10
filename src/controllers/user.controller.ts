import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../config/logger";
import { createToken, setCookie } from "../utils/jwt.utils";
import { User, IUser } from "../models/user.model";
import { failedResponse, successResponse } from "../utils/response.utils";
import { OrganizationModel } from "../models/organization.model";
import { slugify } from "../utils/common.utils";

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

    const { name, email, password, role, organization, isNewOrg } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed: Email already in use: ${email}`);
      failedResponse(res, "Email already in use");
      return;
    }

    let orgId;

    // Handle organization logic
    if (isNewOrg) {
      const existingOrg = await OrganizationModel.findOne({
        name: new RegExp(`^${organization}$`, "i"), // case-insensitive check
        isDelete: false,
      });

      if (existingOrg) {
        logger.info(
          `Organization already exists, using existing orgId: ${existingOrg._id}`
        );
        orgId = existingOrg._id;
      } else {
        const slug = slugify(organization);
        const newOrg = await OrganizationModel.create({
          name: organization,
          slug,
          logoUrl:
            "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png",
          isActive: true,
          isDelete: false,
        });
        orgId = newOrg._id;
        logger.info(`New organization created: ${orgId}`);
      }
    } else {
      orgId = organization; // expecting this to be ObjectId string
    }

    // Create and save user
    const user = new User({
      name,
      email,
      password,
      role,
      organization: orgId,
    });

    await user.save();
    logger.info(`User registered successfully: ${user._id}`);

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

export const getAllInterviewers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("Fetching interviewers for current organization");

    const orgId = req.user?.organization;

    if (!orgId) {
      failedResponse(res, "Organization context not found");
    }

    const interviewers = await User.find({
      role: "interviewer",
      organization: orgId,
    })
      .select("name email")
      .lean();

    logger.info(`Found ${interviewers.length} interviewers`);

    successResponse(res, interviewers, "Interviewers retrieved successfully");
  } catch (error) {
    logger.error("Error fetching interviewers:", error);
    next(error);
  }
};

