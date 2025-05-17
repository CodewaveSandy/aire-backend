import { Schema, model, Document, Types } from "mongoose";

export interface ICandidate extends Document {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  skills: Types.ObjectId[];
  experience: number;
  education?: string;
  about?: string;
  status: "active" | "hired" | "blacklisted";
  socialLinks?: string[];
}

const candidateSchema = new Schema<ICandidate>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String },
    skills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],
    experience: { type: Number, required: true, min: 0 },
    education: { type: String },
    about: { type: String },
    status: {
      type: String,
      enum: ["active", "hired", "blacklisted"],
      default: "active",
    },
    socialLinks: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+/i.test(v); // basic URL format
          },
          message: (props: any) => `${props.value} is not a valid URL`,
        },
      },
    ],
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

export const Candidate = model<ICandidate>("Candidate", candidateSchema);

