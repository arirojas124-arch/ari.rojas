import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { AuditLog } from './audit.models.js';

const router = Router();

router.get('/', requireAuth, requirePermission('audit:read'), async (request, response, next) => {
  try {
    const limit = Math.min(Number(request.query.limit ?? 50), 100);
    const logs = await AuditLog.find({ tenantId: request.authUser!.tenantId })
      .sort({ createdAt: -1 })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 50)
      .lean();

    response.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

export { router as auditRouter };
