"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformText = exports.slugify = void 0;
const slugify = (str) => str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
exports.slugify = slugify;
const transformText = (text = "", method = "lowercase") => {
    switch (method) {
        case "lowercase":
            return text.toLowerCase();
        case "uppercase":
            return text.toUpperCase();
        case "sentence":
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        case "capitalize":
            return text
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
        default:
            return text;
    }
};
exports.transformText = transformText;
//# sourceMappingURL=common.utils.js.map