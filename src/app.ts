import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import userRoutes from "./routes/userRoutes";

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

export default app;

