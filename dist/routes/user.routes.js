"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../config/logger");
const response_utils_1 = require("../utils/response.utils");
const router = (0, express_1.Router)();
// Log all requests to user routes
router.use((req, _res, next) => {
    logger_1.logger.debug(`User route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
// Register a new user
router.post("/register", user_controller_1.registerUser);
// Login user
router.post("/login", user_controller_1.loginUser);
// Get current user (protected route)
router.get("/me", auth_middleware_1.authMiddleware, user_controller_1.getCurrentUser);
// Example of a protected route with role restriction
router.get("/hr-only", auth_middleware_1.authMiddleware, (0, auth_middleware_1.authorize)("hr"), (_req, res) => {
    (0, response_utils_1.successResponse)(res, { message: "HR only resource" });
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map