import multer from "multer";
import path from "path";
import fs from "fs";

// Create local directory if not exists
const uploadDir = path.join(__dirname, "../../uploads/resumes");
const uploadOrgLogo = path.join(__dirname, "../../uploads/organization");

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
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF/DOC/DOCX files are allowed"));
  },
});

export const orgLogoUpload = multer({
  dest: uploadOrgLogo,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files (PNG, JPG, JPEG, WEBP) are allowed"));
  },
});

