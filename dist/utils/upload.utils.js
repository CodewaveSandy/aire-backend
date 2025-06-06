"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgLogoUpload = exports.resumeUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create local directory if not exists
const uploadDir = path_1.default.join(__dirname, "../../uploads/resumes");
const uploadOrgLogo = path_1.default.join(__dirname, "../../uploads/organization");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const sanitized = file.originalname.replace(/\s+/g, "_"); // optional: sanitize spaces
        cb(null, sanitized);
    },
});
exports.resumeUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error("Only PDF/DOC/DOCX files are allowed"));
    },
});
exports.orgLogoUpload = (0, multer_1.default)({
    dest: uploadOrgLogo,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error("Only image files (PNG, JPG, JPEG, WEBP) are allowed"));
    },
});
//# sourceMappingURL=upload.utils.js.map