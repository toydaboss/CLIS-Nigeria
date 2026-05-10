import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "registrar" | "admin";
  jurisdictionState: string | null;
  userCode: string;
  mfaSecret: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["registrar", "admin"], required: true },
    jurisdictionState: { type: String, default: null },
    userCode: { type: String, required: true, unique: true },
    mfaSecret: { type: String, required: true },
  },
  { timestamps: true },
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
