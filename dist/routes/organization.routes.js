"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_controller_1 = require("../controllers/organization.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../config/logger");
const upload_utils_1 = require("../utils/upload.utils");
const router = (0, express_1.Router)();
// Middleware to log organization route accesses
router.use((req, _res, next) => {
    logger_1.logger.debug(`organization route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
// Add Organazation route
router.post("/", auth_middleware_1.authMiddleware, (0, auth_middleware_1.authorize)("hr"), upload_utils_1.orgLogoUpload.single("orgLogo"), organization_controller_1.createOrganization);
// Get all organization
router.get("/", organization_controller_1.getAllOrganisation);
// Get organiation by id
router.get("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.authorize)("hr"), organization_controller_1.getOrganizationById);
// update organiation by id
router.post("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.authorize)("hr"), organization_controller_1.updateOrganizationById);
// Delete organiation by id
router.delete("/:id", auth_middleware_1.authMiddleware, (0, auth_middleware_1.authorize)("hr"), organization_controller_1.deleteOrganizationById);
exports.default = router;
//# sourceMappingURL=organization.routes.js.map