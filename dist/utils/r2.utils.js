"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToR2 = void 0;
// utils/r2.utils.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const r2 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});
const slugify = (str) => str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
const uploadToR2 = async (file, fullName) => {
    const fileStream = fs_1.default.createReadStream(file.path);
    const extension = path_1.default.extname(file.originalname);
    const safeName = slugify(fullName);
    const timestamp = Date.now();
    const key = `${safeName}-${timestamp}${extension}`;
    await r2.send(new client_s3_1.PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
    }));
    return `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
};
exports.uploadToR2 = uploadToR2;
//# sourceMappingURL=r2.utils.js.map