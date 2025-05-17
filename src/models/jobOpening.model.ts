import { Schema, model, Document, Types } from "mongoose";

export interface IJobOpening extends Document {
  title: string;
  description: string;
  skills: Types.ObjectId[];
  minBudget: number;
  maxBudget: number;
  minExpYear: number;
  maxExpYear: number;
  status: "active" | "hold" | "complete";
}

const jobOpeningSchema = new Schema<IJobOpening>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: [{ type: Schema.Types.ObjectId, ref: "Skill", required: true }],
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
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const JobOpening = model<IJobOpening>("JobOpening", jobOpeningSchema);

