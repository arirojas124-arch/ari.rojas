import mongoose, { Model, Schema } from 'mongoose';

export interface AuditLogDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    resource: { type: String, required: true, trim: true, maxlength: 80 },
    resourceId: { type: String, trim: true, maxlength: 120 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog as Model<AuditLogDocument> ??
  mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
