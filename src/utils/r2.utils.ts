// utils/r2.utils.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { slugify } from "./common.utils";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const uploadToR2 = async (
  file: Express.Multer.File,
  fullName: string
) => {
  const fileStream = fs.createReadStream(file.path);
  const extension = path.extname(file.originalname);
  const safeName = slugify(fullName);
  const timestamp = Date.now();
  const key = `${safeName}-${timestamp}${extension}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
};

