import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Room =
  mongoose.models.Room || mongoose.model("Room", roomSchema);
