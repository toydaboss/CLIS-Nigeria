import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  timestamp: Date;
  userCode: string;
  operation: string;
  recordRef: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

const auditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, default: Date.now },
  userCode: { type: String, required: true },
  operation: { type: String, required: true },
  recordRef: { type: String, required: true },
  beforeState: { type: Schema.Types.Mixed, default: null },
  afterState: { type: Schema.Types.Mixed, default: null },
});

export const AuditLog =
  (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
