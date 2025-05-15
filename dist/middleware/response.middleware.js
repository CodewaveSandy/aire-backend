"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseMiddleware = void 0;
const logger_1 = require("../config/logger");
// Middleware to add standard response methods to Response object
const responseMiddleware = (req, res, next) => {
    logger_1.logger.debug(`Request received: ${req.method} ${req.path}`);
    // Success response method
    res.success = function (data, message) {
        const response = {
            status: "success",
            data,
        };
        if (message) {
            response.message = message;
        }
        logger_1.logger.debug(`Success response for ${req.method} ${req.path}`);
        return this.status(200).json(response);
    };
    // Fail response method (validation errors, etc.)
    res.fail = function (message, errors) {
        const response = {
            status: "fail",
            message,
        };
        if (errors) {
            response.errors = errors;
        }
        logger_1.logger.debug(`Fail response for ${req.method} ${req.path}: ${message}`);
        return this.status(400).json(response);
    };
    // Error response method (server errors)
    res.error = function (message, statusCode = 500) {
        const response = {
            status: "error",
            message,
        };
        logger_1.logger.error(`Error response for ${req.method} ${req.path}: ${message}`);
        return this.status(statusCode).json(response);
    };
    next();
};
exports.responseMiddleware = responseMiddleware;
//# sourceMappingURL=response.middleware.js.map