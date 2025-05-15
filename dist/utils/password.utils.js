"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("../config/logger");
// Hash a password
const hashPassword = async (password) => {
    try {
        logger_1.logger.debug("Hashing password");
        const salt = await bcrypt_1.default.genSalt(10);
        return await bcrypt_1.default.hash(password, salt);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Error hashing password: ${error.message}`);
        }
        else {
            logger_1.logger.error("Unknown error hashing password");
        }
        throw new Error("Error hashing password");
    }
};
exports.hashPassword = hashPassword;
// Verify a password
const verifyPassword = async (candidatePassword, hashedPassword) => {
    try {
        logger_1.logger.debug("Verifying password");
        return await bcrypt_1.default.compare(candidatePassword, hashedPassword);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error(`Error verifying password: ${error.message}`);
        }
        else {
            logger_1.logger.error("Unknown error verifying password");
        }
        throw new Error("Error verifying password");
    }
};
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=password.utils.js.map