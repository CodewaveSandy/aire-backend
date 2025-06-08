"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../config/logger");
const interviewRound_controller_1 = require("../controllers/interviewRound.controller");
const router = (0, express_1.Router)();
// Middleware to log skill route accesses
router.use((req, _res, next) => {
    logger_1.logger.debug(`Interview route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
// All routes below require authentication (e.g., HR)
router.use(auth_middleware_1.authMiddleware);
router.get("/:id", (0, auth_middleware_1.authorize)("hr", "interviewer"), interviewRound_controller_1.getInterviewDetails);
router.post("/schedule", (0, auth_middleware_1.authorize)("hr"), interviewRound_controller_1.scheduleInterviewRound);
router.patch("/:id/feedback", (0, auth_middleware_1.authorize)("interviewer"), interviewRound_controller_1.submitInterviewFeedback);
exports.default = router;
//# sourceMappingURL=interviewRounds.routes.js.map