import mongoose, { Document, Schema } from "mongoose";

export interface ITitle extends Document {
  titleRef: string;
  ownerNinLast4: string;
  ownerNameMasked: string;
  jurisdictionState: string;
  lga: string;
  latitude: number;
  longitude: number;
  documentRef: string;
  registrationDate: Date;
  status: "registered" | "disputed" | "pending";
  registeredBy: string;
  disputeCase: string | null;
  lastModified: Date;
}

const titleSchema = new Schema<ITitle>(
  {
    titleRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    ownerNinLast4: { type: String, required: true },
    ownerNameMasked: { type: String, required: true },
    jurisdictionState: { type: String, required: true },
    lga: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    documentRef: { type: String, required: true },
    registrationDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["registered", "disputed", "pending"],
      default: "registered",
    },
    registeredBy: { type: String, required: true },
    disputeCase: { type: String, default: null },
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Title =
  (mongoose.models.Title as mongoose.Model<ITitle>) ||
  mongoose.model<ITitle>("Title", titleSchema);
