import mongoose from "mongoose";
import "../models/room.model.js";
import "../models/User.js";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
