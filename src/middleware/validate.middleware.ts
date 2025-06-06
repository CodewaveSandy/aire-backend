// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // parses & validates
      next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: err.errors || err.message,
      });
    }
  };

