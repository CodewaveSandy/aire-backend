"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
const logger_1 = require("../config/logger");
// Define custom error class with status
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Handle MongoDB validation errors
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};
// Handle MongoDB duplicate field errors
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};
// Handle MongoDB cast errors
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};
// Handle JWT errors
const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401);
// Development error response
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
// Production error response
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // Programming or other unknown error: don't leak error details
    else {
        // 1) Log error
        logger_1.logger.error("ERROR 💥", err);
        // 2) Send generic message
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
        });
    }
};
// Main error handling middleware
const errorMiddleware = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    logger_1.logger.error(`Error: ${err.message}`, {
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
        stack: err.stack,
    });
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    }
    else if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        error.message = err.message;
        if (error.name === "CastError")
            error = handleCastError(error);
        if (error.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (error.name === "ValidationError")
            error = handleValidationError(error);
        if (error.name === "JsonWebTokenError")
            error = handleJWTError();
        if (error.name === "TokenExpiredError")
            error = handleJWTExpiredError();
        sendErrorProd(error, res);
    }
    else {
        // Default to development mode
        sendErrorDev(err, res);
    }
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map