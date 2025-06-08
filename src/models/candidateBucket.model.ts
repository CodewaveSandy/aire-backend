// models/candidateBucket.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ICandidateBucket extends Document {
  job: Types.ObjectId;
  createdBy: Types.ObjectId;
  candidates: {
    candidate: Types.ObjectId;
    currentStage:
      | "shortlisted"
      | "interviewing"
      | "interviewed"
      | "hired"
      | "rejected";
    addedAt: Date;
  }[];
  createdAt: Date;
}

const candidateBucketSchema = new Schema<ICandidateBucket>({
  job: { type: Schema.Types.ObjectId, ref: "JobOpening", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  candidates: [
    {
      candidate: {
        type: Schema.Types.ObjectId,
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

export const CandidateBucket = model<ICandidateBucket>(
  "CandidateBucket",
  candidateBucketSchema
);

