"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.clearCookie = exports.setCookie = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../config/logger");
// JWT secret key and expiration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development-only";
// For token expiration (used in cookie setting)
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || "7";
// Generate JWT token
const createToken = (userId) => {
    try {
        logger_1.logger.debug(`Creating JWT token for user ID: ${userId}`);
        // Create the payload
        const payload = { id: userId };
        // Sign the token with simple approach to avoid type issues
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        return token;
    }
    catch (error) {
        logger_1.logger.error(`Error creating JWT token: ${error}`);
        throw new Error("Error creating authentication token");
    }
};
exports.createToken = createToken;
// Set JWT cookie
const setCookie = (res, token) => {
    try {
        const cookieOptions = {
            expires: new Date(Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // required for HTTPS
        };
        logger_1.logger.debug("Setting JWT cookie");
        res.cookie("jwt", token, { ...cookieOptions, sameSite: "none" });
    }
    catch (error) {
        logger_1.logger.error(`Error setting JWT cookie: ${error}`);
        throw new Error("Error setting authentication cookie");
    }
};
exports.setCookie = setCookie;
// Clear JWT cookie (for logout)
const clearCookie = (res) => {
    try {
        logger_1.logger.debug("Clearing JWT cookie");
        res.cookie("jwt", "logged_out", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error clearing JWT cookie: ${error}`);
        throw new Error("Error clearing authentication cookie");
    }
};
exports.clearCookie = clearCookie;
// Verify JWT token
const verifyToken = (token) => {
    try {
        logger_1.logger.debug("Verifying JWT token");
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        logger_1.logger.error(`Error verifying JWT token: ${error}`);
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.utils.js.map