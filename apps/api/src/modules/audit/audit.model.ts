import mongoose, { Model, Schema } from 'mongoose';

export interface AuditEventDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  method: string;
  statusCode: number;
  occurredAt: Date;
}

const auditEventSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  action: { type: String, required: true, maxlength: 16 },
  resource: { type: String, required: true, maxlength: 240 },
  method: { type: String, required: true, maxlength: 10 },
  statusCode: { type: Number, required: true },
  occurredAt: { type: Date, required: true, default: Date.now }
}, { timestamps: false });
auditEventSchema.index({ tenantId: 1, occurredAt: -1 });

export const AuditEvent: Model<AuditEventDocument> =
  mongoose.models.AuditEvent as Model<AuditEventDocument> ?? mongoose.model<AuditEventDocument>('AuditEvent', auditEventSchema);
