import jwt from "jsonwebtoken";
import { Response } from "express";
import { logger } from "../config/logger";

// JWT secret key and expiration
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development-only";
// For token expiration (used in cookie setting)
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || "7";

// Generate JWT token
export const createToken = (userId: string): string => {
  try {
    logger.debug(`Creating JWT token for user ID: ${userId}`);

    // Create the payload
    const payload = { id: userId };

    // Sign the token with simple approach to avoid type issues
    const token = jwt.sign(payload, JWT_SECRET);

    return token;
  } catch (error) {
    logger.error(`Error creating JWT token: ${error}`);
    throw new Error("Error creating authentication token");
  }
};

// Set JWT cookie
export const setCookie = (res: Response, token: string): void => {
  try {
    const cookieOptions = {
      expires: new Date(
        Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use secure in production
    };

    logger.debug("Setting JWT cookie");
    res.cookie("jwt", token, cookieOptions);
  } catch (error) {
    logger.error(`Error setting JWT cookie: ${error}`);
    throw new Error("Error setting authentication cookie");
  }
};

// Clear JWT cookie (for logout)
export const clearCookie = (res: Response): void => {
  try {
    logger.debug("Clearing JWT cookie");
    res.cookie("jwt", "logged_out", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  } catch (error) {
    logger.error(`Error clearing JWT cookie: ${error}`);
    throw new Error("Error clearing authentication cookie");
  }
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    logger.debug("Verifying JWT token");
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error(`Error verifying JWT token: ${error}`);
    throw new Error("Invalid token");
  }
};

