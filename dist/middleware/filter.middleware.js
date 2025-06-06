"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterMiddleware = void 0;
const filterMiddleware = ({ model, searchableFields = [], multiValueFields = [], defaultSort = "createdAt", allowedFields = [], minSearchLength = 2, restrictByOrg = true, // ✅ Default to true
 }) => {
    return async (req, res, next) => {
        try {
            const { sort, fields, ...query } = req.query;
            const filterQuery = {};
            // ✅ Restrict to user organization if enabled
            if (restrictByOrg && req.user?.organization) {
                filterQuery.organization = req.user.organization;
            }
            // Partial match using regex
            for (const field of searchableFields) {
                if (query[field]) {
                    const value = query[field].trim();
                    if (value.length >= minSearchLength) {
                        filterQuery[field] = { $regex: value, $options: "i" };
                    }
                }
            }
            // Multi-value filters
            for (const field of multiValueFields) {
                if (query[field]) {
                    const values = query[field]
                        .split(",")
                        .map((v) => v.trim());
                    filterQuery[field] = { $in: values };
                }
            }
            // Sorting
            let sortQuery = {};
            if (sort) {
                const fields = sort.split(",");
                fields.forEach((f) => {
                    if (f.startsWith("-")) {
                        sortQuery[f.slice(1)] = -1;
                    }
                    else {
                        sortQuery[f] = 1;
                    }
                });
            }
            else {
                sortQuery = { [defaultSort]: -1 };
            }
            // Field projection
            let fieldProjection = undefined;
            if (fields) {
                const requestedFields = fields.split(",");
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
        }
        catch (err) {
            next(err);
        }
    };
};
exports.filterMiddleware = filterMiddleware;
//# sourceMappingURL=filter.middleware.js.map