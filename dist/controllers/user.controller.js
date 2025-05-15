"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../config/logger");
const jwt_utils_1 = require("../utils/jwt.utils");
const user_model_1 = require("../models/user.model");
const response_utils_1 = require("../utils/response.utils");
// Register a new user
const registerUser = async (req, res, next) => {
    try {
        logger_1.logger.info("Registering new user");
        logger_1.logger.debug("Registration data:", {
            ...req.body,
            password: "***HIDDEN***",
        });
        const { name, email, password, role } = req.body;
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            logger_1.logger.warn(`Registration failed: Email already in use: ${email}`);
            (0, response_utils_1.failedResponse)(res, "Email already in use");
            return;
        }
        // Create new user
        const user = new user_model_1.User({
            name,
            email,
            password,
            role,
        });
        // Save user to database
        await user.save();
        const userId = user._id ? user._id.toString() : "unknown";
        logger_1.logger.info(`User registered successfully: ${userId}`);
        // Return success response with user data
        (0, response_utils_1.successResponse)(res, user, "User registered successfully");
    }
    catch (error) {
        logger_1.logger.error("Error registering user:", error);
        next(error);
    }
};
exports.registerUser = registerUser;
// User login
const loginUser = async (req, res, next) => {
    try {
        logger_1.logger.info("User login attempt");
        const { email, password } = req.body;
        // Validate email and password
        if (!email || !password) {
            logger_1.logger.warn("Login failed: Missing email or password");
            (0, response_utils_1.failedResponse)(res, "Please provide email and password");
            return;
        }
        // Find user with password (for real DB)
        const user = await user_model_1.User.findOne({ email }).select("+password");
        // Check if user exists
        if (!user) {
            logger_1.logger.warn(`Login failed: No user found with email: ${email}`);
            (0, response_utils_1.failedResponse)(res, "Invalid email or password");
            return;
        }
        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger_1.logger.warn(`Login failed: Invalid password for user: ${email}`);
            (0, response_utils_1.failedResponse)(res, "Invalid email or password");
            return;
        }
        // Generate token
        const userId = user._id ? user._id.toString() : "unknown";
        const token = (0, jwt_utils_1.createToken)(userId);
        // Set cookie
        (0, jwt_utils_1.setCookie)(res, token);
        logger_1.logger.info(`User logged in successfully: ${userId}`);
        // Return success response with user data
        (0, response_utils_1.successResponse)(res, user, "Login successful");
    }
    catch (error) {
        logger_1.logger.error("Error logging in user:", error);
        next(error);
    }
};
exports.loginUser = loginUser;
// Get user by ID - used internally
const getUserById = async (id) => {
    try {
        logger_1.logger.debug(`Getting user by ID: ${id}`);
        if (!id) {
            logger_1.logger.warn("No ID provided to getUserById");
            return null;
        }
        return await user_model_1.User.findById(id);
    }
    catch (error) {
        logger_1.logger.error(`Error getting user by ID ${id}:`, error);
        return null;
    }
};
exports.getUserById = getUserById;
// Get current user - protected route
const getCurrentUser = async (req, res, next) => {
    try {
        logger_1.logger.info("Getting current user profile");
        // User should be attached to request by auth middleware
        if (!req.user) {
            throw new error_middleware_1.AppError("Authentication required", 401);
        }
        (0, response_utils_1.successResponse)(res, req.user, "User profile retrieved successfully");
    }
    catch (error) {
        logger_1.logger.error("Error getting current user:", error);
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=user.controller.js.map