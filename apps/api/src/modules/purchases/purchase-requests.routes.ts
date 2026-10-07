import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Product } from '../products/products.model.js';
import { Sequence } from '../sales/sequence.model.js';
import { PurchaseRequest } from './purchases.models.js';

const router = Router();
const createSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive().max(1_000_000)
  }).strict()).min(1).max(100)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'No repitas productos.')
}).strict();
const statusSchema = z.object({ status: z.enum(['approved', 'rejected']) }).strict();

router.get('/', requireAuth, requirePermission('purchases:read'), async (request, response, next) => {
  try {
    const rows = await PurchaseRequest.find({ tenantId: request.authUser!.tenantId }).sort({ createdAt: -1 }).limit(500).lean();
    response.json({ data: rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('purchases:request'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const productIds = input.items.map((item) => new mongoose.Types.ObjectId(item.productId));
    const products = await Product.find({ _id: { $in: productIds }, tenantId, isActive: true });
    if (products.length !== input.items.length) {
      response.status(400).json({ error: { code: 'INVALID_PURCHASE_PRODUCT', message: 'Uno o más productos no existen o están inactivos.' } });
      return;
    }
    const byId = new Map(products.map((product) => [product.id, product]));
    const year = new Date().getUTCFullYear();
    const sequence = await Sequence.findOneAndUpdate(
      { tenantId, kind: 'purchase_request', year },
      { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'purchase_request', year } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (!sequence) throw new Error('No se pudo generar el folio de solicitud.');
    const items = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error('Producto no disponible al preparar la solicitud.');
      return { productId: product._id, sku: product.sku, name: product.name, quantity: item.quantity };
    });
    const row = await PurchaseRequest.create({
      tenantId, requestNumber: `SC-${year}-${String(sequence.value).padStart(6, '0')}`,
      requestedBy: new mongoose.Types.ObjectId(request.authUser!.userId),
      reason: input.reason, items
    });
    response.status(201).json({ data: row.toObject() });
  } catch (error) { next(error); }
});

router.patch('/:requestId', requireAuth, requirePermission('purchases:approve'), async (request, response, next) => {
  try {
    const requestId = request.params.requestId;
    if (typeof requestId !== 'string' || !mongoose.Types.ObjectId.isValid(requestId)) {
      response.status(400).json({ error: { code: 'INVALID_PURCHASE_REQUEST_ID', message: 'Invalid purchase request id' } });
      return;
    }
    const { status } = statusSchema.parse(request.body);
    const row = await PurchaseRequest.findOne({ _id: requestId, tenantId: request.authUser!.tenantId });
    if (!row) {
      response.status(404).json({ error: { code: 'PURCHASE_REQUEST_NOT_FOUND', message: 'Purchase request not found' } });
      return;
    }
    if (row.status !== 'draft') {
      response.status(409).json({ error: { code: 'INVALID_PURCHASE_REQUEST_STATUS', message: 'Solo se pueden resolver solicitudes en borrador.' } });
      return;
    }
    row.status = status;
    await row.save();
    response.json({ data: row.toObject() });
  } catch (error) { next(error); }
});

export { router as purchaseRequestsRouter };
