import "dotenv/config";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import { successResponse } from "./utils/response.utils";

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/health", (_req, res) => {
  successResponse(res, null, "API is healthy");
  return;
});
app.use("/api/users", userRoutes);

export default app;

