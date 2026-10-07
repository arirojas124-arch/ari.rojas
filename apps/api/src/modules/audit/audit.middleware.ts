import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuditEvent } from './audit.model.js';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function auditWriteRequests(request: Request, response: Response, next: NextFunction) {
  if (!writeMethods.has(request.method)) {
    next();
    return;
  }

  response.once('finish', () => {
    const user = request.authUser;
    if (!user || !mongoose.Types.ObjectId.isValid(user.userId) || !mongoose.Types.ObjectId.isValid(user.tenantId)) return;
    const resource = request.originalUrl.split('?')[0]?.slice(0, 240) ?? '/api/v1';
    void AuditEvent.create({
      tenantId: new mongoose.Types.ObjectId(user.tenantId),
      userId: new mongoose.Types.ObjectId(user.userId),
      action: request.method,
      resource,
      method: request.method,
      statusCode: response.statusCode,
      occurredAt: new Date()
    }).catch((error: unknown) => {
      console.error('Failed to persist audit event', error);
    });
  });

  next();
}
