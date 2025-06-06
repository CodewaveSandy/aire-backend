"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orgSkill_controller_1 = require("../controllers/orgSkill.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post("/", (0, auth_middleware_1.authorize)("hr"), orgSkill_controller_1.addSkillToOrg);
router.get("/", orgSkill_controller_1.getOrgSkills);
router.delete("/:id", (0, auth_middleware_1.authorize)("hr"), orgSkill_controller_1.removeOrgSkill);
exports.default = router;
//# sourceMappingURL=orgSkill.routes.js.map