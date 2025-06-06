import { Schema, model, Document, Types } from "mongoose";

export interface IOrgSkill extends Document {
  organization: Types.ObjectId;
  skill: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orgSkillSchema = new Schema<IOrgSkill>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    skill: {
      type: Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

orgSkillSchema.index({ organization: 1, skill: 1 }, { unique: true });

export const OrgSkill = model<IOrgSkill>("OrgSkill", orgSkillSchema);

