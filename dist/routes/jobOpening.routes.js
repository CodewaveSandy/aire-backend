"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobOpening_controller_1 = require("../controllers/jobOpening.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const filter_middleware_1 = require("../middleware/filter.middleware");
const pagination_middleware_1 = require("../middleware/pagination.middleware");
const jobOpening_model_1 = require("../models/jobOpening.model");
const logger_1 = require("../config/logger");
const candidateBucket_controller_1 = require("../controllers/candidateBucket.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((req, _res, next) => {
    logger_1.logger.debug(`Job route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
router.post("/", (0, auth_middleware_1.authorize)("hr"), jobOpening_controller_1.createJobOpening);
router.get("/", (0, filter_middleware_1.filterMiddleware)({
    model: jobOpening_model_1.JobOpening,
    searchableFields: ["title", "description"],
    multiValueFields: ["skills", "status"],
    allowedFields: [
        "title",
        "minBudget",
        "maxBudget",
        "minExpYear",
        "maxExpYear",
        "status",
    ],
    defaultSort: "createdAt",
}), pagination_middleware_1.paginationMiddleware, jobOpening_controller_1.getAllJobOpenings);
router.get("/:id", jobOpening_controller_1.getJobOpeningById);
router.put("/:id", (0, auth_middleware_1.authorize)("hr"), jobOpening_controller_1.updateJobOpening);
router.delete("/:id", (0, auth_middleware_1.authorize)("hr"), jobOpening_controller_1.deleteJobOpening);
router.get("/:id/suggestions", (0, auth_middleware_1.authorize)("hr"), jobOpening_controller_1.getRankedCandidates);
router.get("/:id/progress", (0, auth_middleware_1.authorize)("hr"), jobOpening_controller_1.getJobProgressReport);
router.post("/:id/shortlist", (0, auth_middleware_1.authorize)("hr"), candidateBucket_controller_1.createShortlistBucket);
exports.default = router;
//# sourceMappingURL=jobOpening.routes.js.map