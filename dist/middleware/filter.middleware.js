"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterMiddleware = void 0;
const mongoose_1 = require("mongoose");
const filterMiddleware = ({ model, searchableFields = [], multiValueFields = [], defaultSort = "createdAt", allowedFields = [], minSearchLength = 2, restrictByOrg = true, populateLookups = [], fieldAliases = {}, // ✅ default empty
 }) => {
    return async (req, res, next) => {
        try {
            const { sort, fields, ...query } = req.query;
            // ✅ Determine actual searchable paths
            const actualSearchFields = searchableFields.map((f) => fieldAliases[f] || f);
            const isAggregationNeeded = actualSearchFields.some((f) => f.includes(".")) ||
                populateLookups.length > 0;
            if (!isAggregationNeeded) {
                // ✅ Simple .find() logic
                const filterQuery = {};
                if (restrictByOrg && req.user?.organization) {
                    filterQuery.organization = req.user.organization;
                }
                for (const field of searchableFields) {
                    const actualField = fieldAliases[field] || field;
                    if (query[field]) {
                        const value = query[field].trim();
                        if (value.length >= minSearchLength) {
                            filterQuery[actualField] = { $regex: value, $options: "i" };
                        }
                    }
                }
                for (const field of multiValueFields) {
                    const actualField = fieldAliases[field] || field;
                    if (query[field]) {
                        const values = query[field]
                            .split(",")
                            .map((v) => v.trim());
                        filterQuery[actualField] = { $in: values };
                    }
                }
                // Sort
                let sortQuery = {};
                if (sort) {
                    const sortFields = sort.split(",");
                    sortFields.forEach((f) => {
                        const actual = fieldAliases[f.replace(/^-/, "")] || f.replace(/^-/, "");
                        sortQuery[actual] = f.startsWith("-") ? -1 : 1;
                    });
                }
                else {
                    sortQuery = { [defaultSort]: -1 };
                }
                // Projection
                let fieldProjection = undefined;
                if (fields) {
                    const requestedFields = fields.split(",");
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
            const matchStage = {};
            if (restrictByOrg && req.user?.organization) {
                matchStage.organization = new mongoose_1.Types.ObjectId(req.user.organization);
            }
            const andConditions = [];
            for (const field of searchableFields) {
                const actualField = fieldAliases[field] || field;
                if (query[field]) {
                    const value = query[field].trim();
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
                    const values = query[field]
                        .split(",")
                        .map((v) => v.trim());
                    andConditions.push({ [actualField]: { $in: values } });
                }
            }
            if (andConditions.length > 0)
                matchStage["$and"] = andConditions;
            let sortStage = {};
            if (sort) {
                const sortFields = sort.split(",");
                sortFields.forEach((f) => {
                    const cleanField = f.replace(/^-/, "");
                    const actual = fieldAliases[cleanField] || cleanField;
                    sortStage[actual] = f.startsWith("-") ? -1 : 1;
                });
            }
            else {
                sortStage = { [defaultSort]: -1 };
            }
            let projectStage = {};
            if (fields) {
                const requestedFields = fields.split(",");
                const safeFields = allowedFields.length
                    ? requestedFields.filter((f) => allowedFields.includes(f))
                    : requestedFields;
                safeFields.forEach((f) => {
                    const actual = fieldAliases[f] || f;
                    projectStage[actual] = 1;
                });
            }
            const pipeline = [];
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
        }
        catch (err) {
            next(err);
        }
    };
};
exports.filterMiddleware = filterMiddleware;
//# sourceMappingURL=filter.middleware.js.map