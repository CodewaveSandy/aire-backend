"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationMiddleware = void 0;
const paginationMiddleware = async (req, res, next) => {
    try {
        const model = res.locals.model;
        if (!model)
            throw new Error("Model not defined in res.locals");
        const page = Math.max(parseInt(req.query.page || "1"), 1);
        const limit = Math.max(parseInt(req.query.limit || "10"), 1);
        const skip = (page - 1) * limit;
        const query = model
            .find(res.locals.filterQuery || {})
            .sort(res.locals.sortQuery || {})
            .skip(skip)
            .limit(limit);
        if (res.locals.fieldProjection) {
            query.select(res.locals.fieldProjection);
        }
        const [results, totalCount] = await Promise.all([
            query.exec(),
            model.countDocuments(res.locals.filterQuery || {}),
        ]);
        res.locals.filteredData = {
            results,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
            },
        };
        return next();
    }
    catch (err) {
        return next(err);
    }
};
exports.paginationMiddleware = paginationMiddleware;
//# sourceMappingURL=pagination.middleware.js.map