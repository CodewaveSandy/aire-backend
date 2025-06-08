"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewRound = void 0;
// models/interviewRound.model.ts
const mongoose_1 = require("mongoose");
const interviewRoundSchema = new mongoose_1.Schema({
    job: { type: mongoose_1.Schema.Types.ObjectId, ref: "JobOpening", required: true },
    candidate: { type: mongoose_1.Schema.Types.ObjectId, ref: "Candidate", required: true },
    round: { type: Number, required: true },
    interviewer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date, required: true },
    durationMins: { type: Number, required: true },
    mode: {
        type: String,
        enum: ["online", "in-person", "phone"],
        required: true,
    },
    feedback: { type: String },
    score: { type: Number },
    decision: { type: String, enum: ["proceed", "reject", "hold"] },
    completedAt: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.InterviewRound = (0, mongoose_1.model)("InterviewRound", interviewRoundSchema);
//# sourceMappingURL=interviewRound.model.js.map