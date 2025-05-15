import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

const uri = process.env.MONGODB_URI as string;

export const connectDB = async (): Promise<void> => {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(uri);
    logger.info("MongoDB connection established successfully");
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`MongoDB connection error: ${error.message}`);
    } else {
      logger.error("Unknown MongoDB connection error occurred");
    }
    // Don't exit process in development mode
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      logger.info("Continuing without MongoDB connection");
    }
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed due to app termination");
  process.exit(0);
});

