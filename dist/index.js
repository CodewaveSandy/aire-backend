"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./config/logger");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await (0, database_1.connectDB)();
    app_1.default.listen(PORT, () => {
        logger_1.logger.info(`Server is running on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=index.js.map