import express, {
  Request,
  Response,
  NextFunction,
  Router,
  Application,
} from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import { responseMiddleware } from "./middleware/response.middleware";

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(responseMiddleware);
app.use(morgan("dev"));

// Routes
app.use("/api/users", userRoutes);

export default app;

