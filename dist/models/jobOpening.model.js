"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOpening = void 0;
const mongoose_1 = require("mongoose");
const jobOpeningSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Skill", required: true }],
    minBudget: { type: Number, required: true, min: 0 },
    maxBudget: {
        type: Number,
        required: true,
    },
    minExpYear: { type: Number, required: true, min: 0 },
    maxExpYear: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "hold", "complete"],
        default: "active",
    },
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
exports.JobOpening = (0, mongoose_1.model)("JobOpening", jobOpeningSchema);
//# sourceMappingURL=jobOpening.model.js.map