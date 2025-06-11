"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const common_utils_1 = require("./common.utils");
const logger_1 = require("../config/logger");
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION, // e.g. "ap-south-1"
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const uploadToS3 = async (file, fullName) => {
    const fileStream = fs_1.default.createReadStream(file.path);
    const extension = path_1.default.extname(file.originalname);
    const safeName = (0, common_utils_1.slugify)(fullName);
    const timestamp = Date.now();
    const key = `${safeName}-${timestamp}${extension}`;
    logger_1.logger.info(`Uploading file to S3: ${key} (${file.size} bytes) from ${file.path}`);
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
    }));
    logger_1.logger.info(`File uploaded successfully: ${key}`);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
exports.uploadToS3 = uploadToS3;
//# sourceMappingURL=s3.utils.js.map