import multer from "multer";
import path from "path";
import fs from "fs";

// Create local directory if not exists
const uploadDir = path.join(__dirname, "../../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, "_"); // optional: sanitize spaces
    cb(null, sanitized);
  },
});

export const resumeUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

