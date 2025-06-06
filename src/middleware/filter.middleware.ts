import { Request, Response, NextFunction } from "express";
import { Model } from "mongoose";

export interface FilterOptions {
  model: Model<any>;
  searchableFields?: string[]; // For $regex filters
  multiValueFields?: string[]; // For $in filters
  defaultSort?: string; // Default sort string (e.g., "name")
  allowedFields?: string[]; // For field selection
  minSearchLength?: number; // Minimum characters to allow search
  restrictByOrg?: boolean; // ✅ New flag
}

export const filterMiddleware = ({
  model,
  searchableFields = [],
  multiValueFields = [],
  defaultSort = "createdAt",
  allowedFields = [],
  minSearchLength = 2,
  restrictByOrg = true, // ✅ Default to true
}: FilterOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sort, fields, ...query } = req.query;

      const filterQuery: Record<string, any> = {};

      // ✅ Restrict to user organization if enabled
      if (restrictByOrg && req.user?.organization) {
        filterQuery.organization = req.user.organization;
      }

      // Partial match using regex
      for (const field of searchableFields) {
        if (query[field]) {
          const value = (query[field] as string).trim();
          if (value.length >= minSearchLength) {
            filterQuery[field] = { $regex: value, $options: "i" };
          }
        }
      }

      // Multi-value filters
      for (const field of multiValueFields) {
        if (query[field]) {
          const values = (query[field] as string)
            .split(",")
            .map((v) => v.trim());
          filterQuery[field] = { $in: values };
        }
      }

      // Sorting
      let sortQuery: Record<string, 1 | -1> = {};
      if (sort) {
        const fields = (sort as string).split(",");
        fields.forEach((f) => {
          if (f.startsWith("-")) {
            sortQuery[f.slice(1)] = -1;
          } else {
            sortQuery[f] = 1;
          }
        });
      } else {
        sortQuery = { [defaultSort]: -1 };
      }

      // Field projection
      let fieldProjection: string | undefined = undefined;
      if (fields) {
        const requestedFields = (fields as string).split(",");
        const safeFields = allowedFields.length
          ? requestedFields.filter((f) => allowedFields.includes(f))
          : requestedFields;
        fieldProjection = safeFields.join(" ");
      }

      res.locals.filterQuery = filterQuery;
      res.locals.sortQuery = sortQuery;
      res.locals.fieldProjection = fieldProjection;
      res.locals.model = model;

      next();
    } catch (err) {
      next(err);
    }
  };
};

