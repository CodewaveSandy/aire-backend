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
  interviewUrl: string;
  techSkillScore?: {
    [skillId: string]: number; // skillId is Skill._id (as string)
  };
  softSkillScore?: number;
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
  interviewUrl: {
    type: String,
    validate: {
      validator: function (v: string) {
        return /^https?:\/\/.+/i.test(v);
      },
      message: (props: any) => `${props.value} is not a valid URL`,
    },
  },
  // ✅ NEW FIELD: techSkillScore (dynamic object of skillId: score)
  techSkillScore: {
    type: Map,
    of: {
      type: Number,
      min: 0,
      max: 5,
    },
    default: {},
  },

  // ✅ NEW FIELD: softSkillScore (0 to 5)
  softSkillScore: {
    type: Number,
    min: 0,
    max: 5,
  },
});

export const InterviewRound = model<IInterviewRound>(
  "InterviewRound",
  interviewRoundSchema
);

