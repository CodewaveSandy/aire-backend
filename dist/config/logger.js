"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Define console format
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`));
// Create a logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: logFormat,
    defaultMeta: { service: "api-service" },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        // Error log file transport
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, "../../logs/error.log"),
            level: "error",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        // Combined log file transport
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, "../../logs/combined.log"),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, "../../logs/exceptions.log"),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, "../../logs/rejections.log"),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
});
// Create directory for logs (this is handled by winston)
// If Winston fails to create the directory, it will log an error to the console
//# sourceMappingURL=logger.js.map