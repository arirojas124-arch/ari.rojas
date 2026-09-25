import mongoose from 'mongoose';
import { AuditLog } from './audit.models.js';

export async function writeAuditLog(input: {
  tenantId: string;
  actorUserId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  await AuditLog.create({
    tenantId: new mongoose.Types.ObjectId(input.tenantId),
    actorUserId: input.actorUserId ? new mongoose.Types.ObjectId(input.actorUserId) : undefined,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    metadata: input.metadata
  });
}
