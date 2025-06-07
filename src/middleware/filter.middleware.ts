import { Request, Response, NextFunction } from "express";
import { Model, Types } from "mongoose";

export interface FilterOptions {
  model: Model<any>;
  searchableFields?: string[];
  multiValueFields?: string[];
  defaultSort?: string;
  allowedFields?: string[];
  minSearchLength?: number;
  restrictByOrg?: boolean;
  populateLookups?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    unwind?: boolean;
  }[];
  fieldAliases?: Record<string, string>; // ✅ New
}

export const filterMiddleware = ({
  model,
  searchableFields = [],
  multiValueFields = [],
  defaultSort = "createdAt",
  allowedFields = [],
  minSearchLength = 2,
  restrictByOrg = true,
  populateLookups = [],
  fieldAliases = {}, // ✅ default empty
}: FilterOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sort, fields, ...query } = req.query;

      // ✅ Determine actual searchable paths
      const actualSearchFields = searchableFields.map(
        (f) => fieldAliases[f] || f
      );
      const isAggregationNeeded =
        actualSearchFields.some((f) => f.includes(".")) ||
        populateLookups.length > 0;

      if (!isAggregationNeeded) {
        // ✅ Simple .find() logic
        const filterQuery: Record<string, any> = {};

        if (restrictByOrg && req.user?.organization) {
          filterQuery.organization = req.user.organization;
        }

        for (const field of searchableFields) {
          const actualField = fieldAliases[field] || field;
          if (query[field]) {
            const value = (query[field] as string).trim();
            if (value.length >= minSearchLength) {
              filterQuery[actualField] = { $regex: value, $options: "i" };
            }
          }
        }

        for (const field of multiValueFields) {
          const actualField = fieldAliases[field] || field;
          if (query[field]) {
            const values = (query[field] as string)
              .split(",")
              .map((v) => v.trim());
            filterQuery[actualField] = { $in: values };
          }
        }

        // Sort
        let sortQuery: Record<string, 1 | -1> = {};
        if (sort) {
          const sortFields = (sort as string).split(",");
          sortFields.forEach((f) => {
            const actual =
              fieldAliases[f.replace(/^-/, "")] || f.replace(/^-/, "");
            sortQuery[actual] = f.startsWith("-") ? -1 : 1;
          });
        } else {
          sortQuery = { [defaultSort]: -1 };
        }

        // Projection
        let fieldProjection: string | undefined = undefined;
        if (fields) {
          const requestedFields = (fields as string).split(",");
          const safeFields = allowedFields.length
            ? requestedFields.filter((f) => allowedFields.includes(f))
            : requestedFields;
          fieldProjection = safeFields.join(" ");
        }

        res.locals.queryType = "find";
        res.locals.filterQuery = filterQuery;
        res.locals.sortQuery = sortQuery;
        res.locals.fieldProjection = fieldProjection;
        res.locals.model = model;
        return next();
      }

      // ✅ Aggregation mode
      const matchStage: Record<string, any> = {};
      if (restrictByOrg && req.user?.organization) {
        matchStage.organization = new Types.ObjectId(req.user.organization);
      }

      const andConditions: any[] = [];

      for (const field of searchableFields) {
        const actualField = fieldAliases[field] || field;
        if (query[field]) {
          const value = (query[field] as string).trim();
          if (value.length >= minSearchLength) {
            andConditions.push({
              [actualField]: { $regex: value, $options: "i" },
            });
          }
        }
      }

      for (const field of multiValueFields) {
        const actualField = fieldAliases[field] || field;
        if (query[field]) {
          const values = (query[field] as string)
            .split(",")
            .map((v) => v.trim());
          andConditions.push({ [actualField]: { $in: values } });
        }
      }

      if (andConditions.length > 0) matchStage["$and"] = andConditions;

      let sortStage: Record<string, 1 | -1> = {};
      if (sort) {
        const sortFields = (sort as string).split(",");
        sortFields.forEach((f) => {
          const cleanField = f.replace(/^-/, "");
          const actual = fieldAliases[cleanField] || cleanField;
          sortStage[actual] = f.startsWith("-") ? -1 : 1;
        });
      } else {
        sortStage = { [defaultSort]: -1 };
      }

      let projectStage: any = {};
      if (fields) {
        const requestedFields = (fields as string).split(",");
        const safeFields = allowedFields.length
          ? requestedFields.filter((f) => allowedFields.includes(f))
          : requestedFields;
        safeFields.forEach((f) => {
          const actual = fieldAliases[f] || f;
          projectStage[actual] = 1;
        });
      }

      const pipeline: any[] = [];

      for (const pop of populateLookups) {
        pipeline.push({
          $lookup: {
            from: pop.from,
            localField: pop.localField,
            foreignField: pop.foreignField,
            as: pop.as,
          },
        });
        if (pop.unwind) {
          pipeline.push({ $unwind: `$${pop.as}` });
        }
      }

      pipeline.push({ $match: matchStage });
      pipeline.push({ $sort: sortStage });
      if (Object.keys(projectStage).length > 0) {
        pipeline.push({ $project: projectStage });
      }

      res.locals.queryType = "aggregate";
      res.locals.pipeline = pipeline;
      res.locals.model = model;
      next();
    } catch (err) {
      next(err);
    }
  };
};

