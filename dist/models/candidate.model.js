"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Candidate = void 0;
const mongoose_1 = require("mongoose");
const candidateSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String },
    skills: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Skill" }],
    experience: { type: Number, required: true, min: 0 },
    education: { type: String },
    about: { type: String },
    resumeUrl: { type: String },
    status: {
        type: String,
        enum: ["active", "hired", "blacklisted"],
        default: "active",
    },
    socialLinks: [
        {
            type: String,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/i.test(v); // basic URL format
                },
                message: (props) => `${props.value} is not a valid URL`,
            },
        },
    ],
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        },
    },
});
exports.Candidate = (0, mongoose_1.model)("Candidate", candidateSchema);
//# sourceMappingURL=candidate.model.js.map