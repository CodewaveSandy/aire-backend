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

// Custom response middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.success = function (data: any, message?: string) {
    return res.json({
      status: "success",
      data,
      message: message || "Operation successful",
    });
  };

  res.fail = function (message: string, errors?: any) {
    return res.status(400).json({
      status: "fail",
      message,
      errors,
    });
  };

  res.error = function (message: string, statusCode: number = 500) {
    return res.status(statusCode).json({
      status: "error",
      message,
    });
  };

  next();
});

// Routes
app.use("/api/users", userRoutes);

export default app;

