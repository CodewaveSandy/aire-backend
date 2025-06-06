"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationModel = void 0;
const mongoose_1 = require("mongoose");
// Define organization Schema
const organizationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        default: "",
    },
    logoUrl: {
        type: String,
        default: "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDelete: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.OrganizationModel = (0, mongoose_1.model)("organization", organizationSchema);
//# sourceMappingURL=organization.model.js.map