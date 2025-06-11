import "dotenv/config";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { join, resolve } from "path";
import cookieParser from "cookie-parser";
import { successResponse } from "./utils/response.utils";

import userRoutes from "./routes/user.routes";
import skillRoutes from "./routes/skill.routes";
import jobOpeningRoutes from "./routes/jobOpening.routes";
import candidateRoutes from "./routes/candidate.routes";
import organizationRoutes from "./routes/organization.routes";
import orgSkillRoutes from "./routes/orgSkill.routes";
import interviewRoundRoutes from "./routes/interviewRounds.routes";

const app: Application = express();

const allowedOrigins = [
  "https://preview--hr-flow-ai.lovable.app",
  "https://your-production-domain.com",
  "http://localhost:8080",
];

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.static(resolve(join(__dirname, "uploads"))));

// Routes
app.use("/api/health", (_req, res) => {
  successResponse(res, null, "API is healthy");
  return;
});
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/jobs", jobOpeningRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/org-skills", orgSkillRoutes);
app.use("/api/interviews", interviewRoundRoutes);

export default app;

