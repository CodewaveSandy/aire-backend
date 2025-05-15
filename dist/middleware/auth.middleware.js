"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../config/logger");
const user_controller_1 = require("../controllers/user.controller");
// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development-only";
// Verify JWT token
const authMiddleware = async (req, res, next) => {
    try {
        logger_1.logger.debug("Validating authentication token");
        // Check for token in cookies or authorization header
        let token;
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        else if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            logger_1.logger.warn("Authentication failed: No token provided");
            res.status(401).json({
                status: "error",
                message: "You are not logged in. Please log in to get access.",
            });
            return;
        }
        // Verify token
        try {
            // Cast secret to the type expected by jsonwebtoken
            const secret = JWT_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            logger_1.logger.debug(`Token verified for user ID: ${decoded.id}`);
            // Get user from database
            const user = await (0, user_controller_1.getUserById)(decoded.id);
            if (!user) {
                logger_1.logger.warn(`Authentication failed: User not found with ID: ${decoded.id}`);
                res.status(401).json({
                    status: "error",
                    message: "The user belonging to this token no longer exists.",
                });
                return;
            }
            // Attach user to request object
            req.user = user;
            next();
        }
        catch (error) {
            logger_1.logger.warn("Invalid token:", error);
            res.status(401).json({
                status: "error",
                message: "Invalid token. Please log in again.",
            });
        }
    }
    catch (error) {
        logger_1.logger.error("Error in auth middleware:", error);
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            logger_1.logger.warn("Authorization failed: No user on request");
            res.status(401).json({
                status: "error",
                message: "You must be logged in to access this resource",
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn(`Authorization failed: User role ${req.user.role} not authorized`);
            res.status(403).json({
                status: "error",
                message: "You do not have permission to perform this action",
            });
            return;
        }
        logger_1.logger.debug(`User authorized with role: ${req.user.role}`);
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map