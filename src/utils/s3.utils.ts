import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { slugify } from "./common.utils";
import { logger } from "../config/logger";

const s3 = new S3Client({
  region: process.env.AWS_REGION!, // e.g. "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  file: Express.Multer.File,
  fullName: string
): Promise<string> => {
  const fileStream = fs.createReadStream(file.path);
  const extension = path.extname(file.originalname);
  const safeName = slugify(fullName);
  const timestamp = Date.now();
  const key = `${safeName}-${timestamp}${extension}`;

  logger.info(
    `Uploading file to S3: ${key} (${file.size} bytes) from ${file.path}`
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    })
  );

  logger.info(`File uploaded successfully: ${key}`);

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

