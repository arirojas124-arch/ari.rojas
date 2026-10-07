import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { AuditEvent } from './audit.model.js';

const router = Router();

router.get('/', requireAuth, requirePermission('audit:read'), async (request, response, next) => {
  try {
    const rows = await AuditEvent.find({ tenantId: request.authUser!.tenantId })
      .sort({ occurredAt: -1 }).limit(1000).lean();
    response.json({ data: rows });
  } catch (error) { next(error); }
});

export { router as auditRouter };
