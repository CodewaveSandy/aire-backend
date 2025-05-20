"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skill = void 0;
const mongoose_1 = require("mongoose");
const skillSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    aliases: { type: [String], default: [] }, // ✅ new field
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.__v;
            ret.id = ret._id;
            delete ret._id;
        },
    },
});
exports.Skill = (0, mongoose_1.model)("Skill", skillSchema);
//# sourceMappingURL=skill.model.js.map