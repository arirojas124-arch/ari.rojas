import { Router } from 'express';
import { z } from 'zod';
import { Company } from '../auth/auth.models.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();

const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  address: z.string().trim().max(240).optional(),
  phone: z.string().trim().max(40).optional()
}).strict();

router.get('/me', requireAuth, requirePermission('companies:read'), async (request, response, next) => {
  try {
    const company = await Company.findById(request.authUser!.tenantId).lean();
    if (!company || !company.isActive) {
      response.status(404).json({ error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found' } });
      return;
    }

    response.json({ data: company });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', requireAuth, requirePermission('companies:write'), async (request, response, next) => {
  try {
    const input = updateCompanySchema.parse(request.body);
    const company = await Company.findOneAndUpdate(
      { _id: request.authUser!.tenantId, isActive: true },
      { $set: input },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      response.status(404).json({ error: { code: 'COMPANY_NOT_FOUND', message: 'Company not found' } });
      return;
    }

    response.json({ data: company });
  } catch (error) {
    next(error);
  }
});

export { router as companiesRouter };