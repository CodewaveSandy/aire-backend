"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create local directory if not exists
const uploadDir = path_1.default.join(__dirname, "../../uploads/resumes");
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
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF and DOCX files are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
//# sourceMappingURL=upload.utils.js.map