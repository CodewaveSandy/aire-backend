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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const response_utils_1 = require("./utils/response.utils");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const skill_routes_1 = __importDefault(require("./routes/skill.routes"));
const jobOpening_routes_1 = __importDefault(require("./routes/jobOpening.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "https://preview--hr-flow-ai.lovable.app", // your frontend origin
    credentials: true, // allow cookies/auth headers
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
// Routes
app.use("/api/health", (_req, res) => {
    (0, response_utils_1.successResponse)(res, null, "API is healthy");
    return;
});
app.use("/api/users", user_routes_1.default);
app.use("/api/skills", skill_routes_1.default);
app.use("/api/jobs", jobOpening_routes_1.default);
app.use("/api/candidates", candidate_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map