import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { accessSecret } from '../../config.js';
import type { AuthUser } from './auth.types.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
    return;
  }

  try {
    const payload = jwt.verify(token, accessSecret);
    if (typeof payload === 'string' || !payload.sub || typeof payload.tenantId !== 'string' || typeof payload.role !== 'string') {
      throw new Error('Invalid claims');
    }

    const permissions = Array.isArray(payload.permissions) && payload.permissions.every((value) => typeof value === 'string') ? payload.permissions : [];
    request.authUser = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role, permissions };
    next();
  } catch {
    response.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
}

export function requirePermission(permission: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser?.permissions.includes(permission)) {
      response.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }

    next();
  };
}