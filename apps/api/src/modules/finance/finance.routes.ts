import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { FinanceTransaction } from './finance.model.js';

const router = Router();
const fields = {
  kind: z.enum(['income', 'expense']),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(240),
  amount: z.number().finite().positive(),
  occurredAt: z.string().datetime(),
  reference: z.string().trim().max(100).optional()
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object(fields).partial().strict();
const patchSchema = z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict();

router.get('/', requireAuth, requirePermission('finance:read'), async (request, response, next) => {
  try {
    const rows = await FinanceTransaction.find({ tenantId: request.authUser!.tenantId })
      .sort({ occurredAt: -1 }).limit(1000).lean();
    response.json({ data: rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('finance:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const transaction = await FinanceTransaction.create({
      ...input, occurredAt: new Date(input.occurredAt),
      tenantId: request.authUser!.tenantId,
      createdBy: request.authUser!.userId
    });
    response.status(201).json({ data: transaction.toObject() });
  } catch (error) { next(error); }
});

router.patch('/:transactionId', requireAuth, requirePermission('finance:write'), async (request, response, next) => {
  try {
    const transactionId = request.params.transactionId;
    if (typeof transactionId !== 'string' || !mongoose.Types.ObjectId.isValid(transactionId)) {
      response.status(400).json({ error: { code: 'INVALID_FINANCE_TRANSACTION_ID', message: 'Invalid finance transaction id' } });
      return;
    }
    const input = patchSchema.parse(request.body);
    const update = { ...input, ...(input.occurredAt ? { occurredAt: new Date(input.occurredAt) } : {}) };
    const transaction = await FinanceTransaction.findOneAndUpdate(
      { _id: transactionId, tenantId: request.authUser!.tenantId },
      { $set: update }, { new: true, runValidators: true }
    ).lean();
    if (!transaction) {
      response.status(404).json({ error: { code: 'FINANCE_TRANSACTION_NOT_FOUND', message: 'Finance transaction not found' } });
      return;
    }
    response.json({ data: transaction });
  } catch (error) { next(error); }
});

export { router as financeRouter };
