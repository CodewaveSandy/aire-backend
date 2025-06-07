"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const skill_controller_1 = require("../controllers/skill.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../config/logger");
const filter_middleware_1 = require("../middleware/filter.middleware");
const pagination_middleware_1 = require("../middleware/pagination.middleware");
const orgSkill_model_1 = require("../models/orgSkill.model");
const router = (0, express_1.Router)();
// Middleware to log skill route accesses
router.use((req, _res, next) => {
    logger_1.logger.debug(`Skill route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
// All routes below require authentication (e.g., HR)
router.use(auth_middleware_1.authMiddleware);
router.post("/", (0, auth_middleware_1.authorize)("hr"), skill_controller_1.createSkill);
router.get("/", (0, filter_middleware_1.filterMiddleware)({
    model: orgSkill_model_1.OrgSkill,
    searchableFields: ["name", "slug"],
    populateLookups: [
        {
            from: "skills", // MongoDB collection name
            localField: "skill",
            foreignField: "_id",
            as: "skill",
            unwind: true,
        },
    ],
    fieldAliases: {
        name: "skill.name",
        slug: "skill.slug",
    },
    defaultSort: "createdAt",
}), pagination_middleware_1.paginationMiddleware, skill_controller_1.getAllSkills);
router.get("/:id", skill_controller_1.getSkillById);
router.put("/:id", (0, auth_middleware_1.authorize)("hr"), skill_controller_1.updateSkill);
router.delete("/:id", (0, auth_middleware_1.authorize)("hr"), skill_controller_1.deleteSkill);
exports.default = router;
//# sourceMappingURL=skill.routes.js.map