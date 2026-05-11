import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export async function connectDB(): Promise<void> {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin";
  const safe = uri.replace(/:([^@]+)@/, ":***@"); // hide password in logs
  console.log(`Connecting to MongoDB: ${safe}`);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Successfully");
}

export { mongoose };
