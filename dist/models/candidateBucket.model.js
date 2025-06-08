"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateBucket = void 0;
// models/candidateBucket.model.ts
const mongoose_1 = require("mongoose");
const candidateBucketSchema = new mongoose_1.Schema({
    job: { type: mongoose_1.Schema.Types.ObjectId, ref: "JobOpening", required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    candidates: [
        {
            candidate: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Candidate",
                required: true,
            },
            currentStage: {
                type: String,
                enum: [
                    "shortlisted",
                    "interviewing",
                    "interviewed",
                    "hired",
                    "rejected",
                ],
                default: "shortlisted",
            },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: { type: Date, default: Date.now },
});
exports.CandidateBucket = (0, mongoose_1.model)("CandidateBucket", candidateBucketSchema);
//# sourceMappingURL=candidateBucket.model.js.map