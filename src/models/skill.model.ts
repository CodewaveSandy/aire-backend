import { Schema, model, Document } from "mongoose";

export interface ISkill extends Document {
  name: string;
  slug: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    aliases: { type: [String], default: [] }, // ✅ new field
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
      },
    },
  }
);

export const Skill = model<ISkill>("Skill", skillSchema);

