import bcrypt from "bcrypt";
import { logger } from "../config/logger";

// Hash a password
export const hashPassword = async (password: string): Promise<string> => {
  try {
    logger.debug("Hashing password");
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error hashing password: ${error.message}`);
    } else {
      logger.error("Unknown error hashing password");
    }
    throw new Error("Error hashing password");
  }
};

// Verify a password
export const verifyPassword = async (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    logger.debug("Verifying password");
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error verifying password: ${error.message}`);
    } else {
      logger.error("Unknown error verifying password");
    }
    throw new Error("Error verifying password");
  }
};

