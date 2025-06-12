"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.extractRelevantSections = exports.extractPhone = exports.extractEmail = exports.extractName = exports.extractTextFromFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const textract_1 = __importDefault(require("textract"));
const mammoth = __importStar(require("mammoth"));
const extractTextFromFile = async (filePath) => {
    const ext = path_1.default.extname(filePath).toLowerCase();
    let extractedText = "";
    // if (ext === ".pdf") {
    //   const fileBuffer = fs.readFileSync(filePath);
    //   const pdfData = await pdfParse(fileBuffer);
    //   extractedText = pdfData.text;
    // } else {
    //   extractedText = await new Promise<string>((resolve, reject) => {
    //     textract.fromFileWithPath(filePath, (err, text) => {
    //       if (err || !text) return reject(err || new Error("Empty text"));
    //       resolve(text);
    //     });
    //   });
    // }
    if (ext === ".pdf") {
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const pdfData = await (0, pdf_parse_1.default)(fileBuffer);
        extractedText = pdfData.text;
    }
    else if (ext === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
    }
    else {
        extractedText = await new Promise((resolve, reject) => {
            textract_1.default.fromFileWithPath(filePath, (err, text) => {
                if (err || !text)
                    return reject(err || new Error("Empty text"));
                resolve(text);
            });
        });
    }
    return extractedText;
};
exports.extractTextFromFile = extractTextFromFile;
const extractName = (text) => {
    const FAMILY_LABELS = [
        "father",
        "mother",
        "guardian",
        "spouse",
        "husband",
        "wife",
    ];
    const HEADER_LABELS = [
        "work experience",
        "education",
        "skills",
        "projects",
        "summary",
        "objective",
        "overview",
        "declaration",
    ];
    const familyRegex = new RegExp(`\\b(${FAMILY_LABELS.join("|")})\\b`, "i");
    const headingRegex = new RegExp(`^(${HEADER_LABELS.join("|")})$`, "i");
    // ✅ Fix 1: Better label-based match (line-by-line)
    const labelMatch = text.match(/^\s*(name|full name|first name)\s*[:\-–]\s*([A-Z][A-Za-z\s.-]{1,60})$/im);
    if (labelMatch) {
        return labelMatch[2].trim();
    }
    // Line-by-line analysis
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    for (const line of lines.slice(0, 10)) {
        const clean = line.replace(/[^A-Za-z\s().-]/g, "").trim();
        if (clean.length > 0 &&
            !familyRegex.test(clean) &&
            !headingRegex.test(clean.toLowerCase()) &&
            /^[A-Z][a-zA-Z().\s-]{2,}$/.test(clean) &&
            clean.split(" ").length <= 5) {
            return clean;
        }
    }
    const headingIndex = lines.findIndex((line) => headingRegex.test(line.toLowerCase()));
    if (headingIndex > 0) {
        const candidate = lines[headingIndex - 1];
        const clean = candidate.replace(/[^A-Za-z\s().-]/g, "").trim();
        if (clean.length > 0 &&
            !familyRegex.test(clean) &&
            clean.split(" ").length <= 5 &&
            /^[A-Z][a-zA-Z().\s-]+$/.test(clean)) {
            return clean;
        }
    }
    return null;
};
exports.extractName = extractName;
const extractEmail = (text) => {
    const match = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}/);
    return match ? match[0] : null;
};
exports.extractEmail = extractEmail;
const extractPhone = (text) => {
    const match = text.match(/(\+?\d{1,3}[\s-]?)?(\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4}/);
    return match ? match[0].trim() : null;
};
exports.extractPhone = extractPhone;
const extractRelevantSections = (text) => {
    const sectionHeaderKeywords = [
        "skills",
        "technical skills",
        "tools",
        "technologies",
        "languages known",
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "projects",
        "roles & responsibility",
        "technology used",
    ];
    const sectionStopKeywords = [
        "education",
        "certification",
        "declaration",
        "objective",
        "summary",
        "contact",
        "personal info",
    ];
    const normalize = (s) => s.trim().toLowerCase();
    const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
    const collected = [];
    let isCollecting = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const normalized = normalize(line);
        // Start if a line matches a header
        if (sectionHeaderKeywords.some((keyword) => normalized === keyword || normalized.includes(keyword))) {
            isCollecting = true;
            collected.push(`\n### ${line.toUpperCase()} ###`);
            continue;
        }
        // Stop if a known non-relevant section starts
        if (isCollecting &&
            sectionStopKeywords.some((keyword) => normalized === keyword || normalized.includes(keyword))) {
            isCollecting = false;
            continue;
        }
        // If collecting and not hitting a new unrelated section, collect the line
        if (isCollecting) {
            collected.push(line);
        }
    }
    return collected.join("\n").trim();
};
exports.extractRelevantSections = extractRelevantSections;
const escapeRegExp = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=parser.utils.js.map