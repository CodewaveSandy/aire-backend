"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const path_1 = require("path");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const response_utils_1 = require("./utils/response.utils");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const skill_routes_1 = __importDefault(require("./routes/skill.routes"));
const jobOpening_routes_1 = __importDefault(require("./routes/jobOpening.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const organization_routes_1 = __importDefault(require("./routes/organization.routes"));
const orgSkill_routes_1 = __importDefault(require("./routes/orgSkill.routes"));
const interviewRounds_routes_1 = __importDefault(require("./routes/interviewRounds.routes"));
const app = (0, express_1.default)();
const allowedOrigins = [
    "https://preview--hr-flow-ai.lovable.app",
    "https://your-production-domain.com",
    "http://localhost:8080",
];
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static((0, path_1.resolve)((0, path_1.join)(__dirname, "uploads"))));
// Routes
app.use("/api/health", (_req, res) => {
    (0, response_utils_1.successResponse)(res, null, "API is healthy");
    return;
});
app.use("/api/users", user_routes_1.default);
app.use("/api/skills", skill_routes_1.default);
app.use("/api/jobs", jobOpening_routes_1.default);
app.use("/api/candidates", candidate_routes_1.default);
app.use("/api/organizations", organization_routes_1.default);
app.use("/api/org-skills", orgSkill_routes_1.default);
app.use("/api/interviews", interviewRounds_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map