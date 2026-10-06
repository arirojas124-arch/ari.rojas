import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Invoice } from './invoices.model.js';

const router = Router();
const invoiceStatusSchema = z.object({ status: z.enum(['pending', 'paid']) }).strict();

router.get('/', requireAuth, requirePermission('invoices:read'), async (request, response, next) => {
  try {
    const invoices = await Invoice.find({ tenantId: request.authUser!.tenantId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    response.json({ data: invoices });
  } catch (error) {
    next(error);
  }
});

router.patch('/:invoiceId', requireAuth, requirePermission('invoices:write'), async (request, response, next) => {
  try {
    const invoiceId = request.params.invoiceId;
    if (typeof invoiceId !== 'string' || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      response.status(400).json({ error: { code: 'INVALID_INVOICE_ID', message: 'Invalid invoice id' } });
      return;
    }

    const { status } = invoiceStatusSchema.parse(request.body);
    const update = status === 'paid'
      ? { $set: { status, paidAt: new Date() } }
      : { $set: { status }, $unset: { paidAt: 1 } };
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, tenantId: request.authUser!.tenantId },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!invoice) {
      response.status(404).json({ error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } });
      return;
    }

    response.json({ data: invoice });
  } catch (error) {
    next(error);
  }
});

export { router as invoicesRouter };
