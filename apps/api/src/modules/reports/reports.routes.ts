import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Invoice } from '../invoices/invoices.model.js';
import { Sale } from '../sales/sales.model.js';

const router = Router();
const querySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional()
}).strict().refine(({ from, to }) => !from || !to || from <= to, {
  message: 'La fecha inicial debe ser anterior o igual a la fecha final.'
});

router.get('/sales', requireAuth, requirePermission('reports:read'), async (request, response, next) => {
  try {
    const query = querySchema.parse(request.query);
    const createdAt: { $gte?: Date; $lt?: Date } = {};
    if (query.from) createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) {
      const inclusiveEnd = new Date(`${query.to}T00:00:00.000Z`);
      inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);
      createdAt.$lt = inclusiveEnd;
    }

    const filter: Record<string, unknown> = { tenantId: new mongoose.Types.ObjectId(request.authUser!.tenantId) };
    if (Object.keys(createdAt).length) filter.createdAt = createdAt;

    const [salesSummary, invoiceSummary, topProducts, dailySales] = await Promise.all([
      Sale.aggregate([
        { $match: filter },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' }, average: { $avg: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
      ]),
      Sale.aggregate([
        { $match: filter },
        { $unwind: '$items' },
        { $group: { _id: { sku: '$items.sku', name: '$items.name' }, quantity: { $sum: '$items.quantity' }, total: { $sum: '$items.lineTotal' } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, sku: '$_id.sku', name: '$_id.name', quantity: 1, total: 1 } }
      ]),
      Sale.aggregate([
        { $match: filter },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 }, total: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1, total: 1 } }
      ])
    ]);

    const statusTotals = Object.fromEntries(invoiceSummary.map((entry) => [entry._id, { count: entry.count, total: entry.total }]));
    response.json({
      data: {
        currency: 'MXN',
        period: { from: query.from ?? null, to: query.to ?? null },
        sales: {
          count: salesSummary[0]?.count ?? 0,
          total: salesSummary[0]?.total ?? 0,
          average: Math.round((salesSummary[0]?.average ?? 0) * 100) / 100
        },
        invoices: {
          paid: statusTotals.paid ?? { count: 0, total: 0 },
          pending: statusTotals.pending ?? { count: 0, total: 0 }
        },
        topProducts,
        dailySales
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as reportsRouter };
