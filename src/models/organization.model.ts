import { Schema, model, Document } from "mongoose";

export interface IOrg extends Document {
  name: String;
  slug: String;
  logoUrl: String;
  isActive: Boolean;
  isDelete: Boolean;
}

// Define organization Schema
const organizationSchema = new Schema<IOrg>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      default: "",
    },
    logoUrl: {
      type: String,
      default:
        "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OrganizationModel = model<IOrg>(
  "organization",
  organizationSchema
);

