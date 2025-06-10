// models/interviewRound.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IInterviewRound extends Document {
  job: Types.ObjectId;
  candidate: Types.ObjectId;
  round: number;
  interviewer: Types.ObjectId;
  scheduledAt: Date;
  durationMins: number;
  mode: "online" | "in-person" | "phone";
  feedback?: string;
  score?: number;
  decision?: "proceed" | "reject" | "hold";
  completedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  organization: Types.ObjectId;
}

const interviewRoundSchema = new Schema<IInterviewRound>({
  job: { type: Schema.Types.ObjectId, ref: "JobOpening", required: true },
  candidate: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
  round: { type: Number, required: true },
  interviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  scheduledAt: { type: Date, required: true },
  durationMins: { type: Number, required: true },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  mode: {
    type: String,
    enum: ["online", "in-person", "phone"],
    required: true,
  },
  feedback: { type: String },
  score: { type: Number },
  decision: { type: String, enum: ["proceed", "reject", "hold"] },
  completedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const InterviewRound = model<IInterviewRound>(
  "InterviewRound",
  interviewRoundSchema
);

