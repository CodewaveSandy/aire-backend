import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

// Define response structure
interface StandardResponse {
  status: "success" | "error" | "fail";
  data?: any;
  message?: string;
  errors?: any;
}

// Extend Express Response to include our standard response methods
declare global {
  namespace Express {
    interface Response {
      success(data: any, message?: string): Response;
      fail(message: string, errors?: any): Response;
      error(message: string, statusCode?: number): Response;
    }
  }
}

// Middleware to add standard response methods to Response object
export const responseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.debug(`Request received: ${req.method} ${req.path}`);

  // Success response method
  res.success = function (data: any, message?: string): Response {
    const response: StandardResponse = {
      status: "success",
      data,
    };

    if (message) {
      response.message = message;
    }

    logger.debug(`Success response for ${req.method} ${req.path}`);
    return this.status(200).json(response);
  };

  // Fail response method (validation errors, etc.)
  res.fail = function (message: string, errors?: any): Response {
    const response: StandardResponse = {
      status: "fail",
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    logger.debug(`Fail response for ${req.method} ${req.path}: ${message}`);
    return this.status(400).json(response);
  };

  // Error response method (server errors)
  res.error = function (message: string, statusCode: number = 500): Response {
    const response: StandardResponse = {
      status: "error",
      message,
    };

    logger.error(`Error response for ${req.method} ${req.path}: ${message}`);
    return this.status(statusCode).json(response);
  };

  next();
};

