"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
dotenv_1.default.config();
const uri = process.env.MONGODB_URI;
const connectDB = async () => {
    try {
        logger_1.logger.info("Connecting to MongoDB...");
        await mongoose_1.default.connect(uri);
        logger_1.logger.info("MongoDB connection established successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`MongoDB connection error: ${error.message}`);
        }
        else {
            logger_1.logger.error("Unknown MongoDB connection error occurred");
        }
        // Don't exit process in development mode
        if (process.env.NODE_ENV === "production") {
            process.exit(1);
        }
        else {
            logger_1.logger.info("Continuing without MongoDB connection");
        }
    }
};
exports.connectDB = connectDB;
// Handle connection events
mongoose_1.default.connection.on("disconnected", () => {
    logger_1.logger.warn("MongoDB disconnected");
});
mongoose_1.default.connection.on("reconnected", () => {
    logger_1.logger.info("MongoDB reconnected");
});
mongoose_1.default.connection.on("error", (err) => {
    logger_1.logger.error(`MongoDB connection error: ${err.message}`);
});
// Graceful shutdown
process.on("SIGINT", async () => {
    await mongoose_1.default.connection.close();
    logger_1.logger.info("MongoDB connection closed due to app termination");
    process.exit(0);
});
//# sourceMappingURL=database.js.map