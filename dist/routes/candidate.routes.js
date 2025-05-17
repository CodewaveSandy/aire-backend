"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidate_controller_1 = require("../controllers/candidate.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const filter_middleware_1 = require("../middleware/filter.middleware");
const pagination_middleware_1 = require("../middleware/pagination.middleware");
const candidate_model_1 = require("../models/candidate.model");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post("/", (0, auth_middleware_1.authorize)("hr"), candidate_controller_1.createCandidate);
router.get("/", (0, filter_middleware_1.filterMiddleware)({
    model: candidate_model_1.Candidate,
    searchableFields: ["fullName", "email", "location", "education"],
    multiValueFields: ["skills", "status"],
    allowedFields: ["fullName", "email", "experience", "location", "status"],
    defaultSort: "createdAt",
}), pagination_middleware_1.paginationMiddleware, candidate_controller_1.getAllCandidates);
router.get("/:id", candidate_controller_1.getCandidateById);
router.put("/:id", (0, auth_middleware_1.authorize)("hr"), candidate_controller_1.updateCandidate);
router.delete("/:id", (0, auth_middleware_1.authorize)("hr"), candidate_controller_1.deleteCandidate);
exports.default = router;
//# sourceMappingURL=candidate.routes.js.map