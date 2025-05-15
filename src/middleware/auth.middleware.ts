import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger";
import { IUser } from "../models/user.model";
import { getUserById } from "../controllers/user.controller";

// JWT secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development-only";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Verify JWT token
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.debug("Validating authentication token");

    // Check for token in cookies or authorization header
    let token: string | undefined;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      logger.warn("Authentication failed: No token provided");
      res.status(401).json({
        status: "error",
        message: "You are not logged in. Please log in to get access.",
      });
      return;
    }

    // Verify token
    try {
      // Cast secret to the type expected by jsonwebtoken
      const secret = JWT_SECRET as jwt.Secret;
      const decoded = jwt.verify(token, secret) as { id: string };
      logger.debug(`Token verified for user ID: ${decoded.id}`);

      // Get user from database
      const user = await getUserById(decoded.id);

      if (!user) {
        logger.warn(
          `Authentication failed: User not found with ID: ${decoded.id}`
        );
        res.status(401).json({
          status: "error",
          message: "The user belonging to this token no longer exists.",
        });
        return;
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      logger.warn("Invalid token:", error);
      res.status(401).json({
        status: "error",
        message: "Invalid token. Please log in again.",
      });
    }
  } catch (error) {
    logger.error("Error in auth middleware:", error);
    next(error);
  }
};

// Role-based authorization
export const authorize = (...roles: Array<"hr" | "interviewer">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn("Authorization failed: No user on request");
      res.status(401).json({
        status: "error",
        message: "You must be logged in to access this resource",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Authorization failed: User role ${req.user.role} not authorized`
      );
      res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
      return;
    }

    logger.debug(`User authorized with role: ${req.user.role}`);
    next();
  };
};

