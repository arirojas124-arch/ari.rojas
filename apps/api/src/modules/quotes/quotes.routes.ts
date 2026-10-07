import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Customer } from '../customers/customers.model.js';
import { Product } from '../products/products.model.js';
import { Sequence } from '../sales/sequence.model.js';
import { Quote } from './quotes.model.js';

const router = Router();
const createSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive().max(1_000_000)
  }).strict()).min(1).max(100)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'No repitas productos; actualiza la cantidad en su renglón.'),
  validUntil: z.string().date().optional()
}).strict();
const updateSchema = z.object({ status: z.enum(['sent', 'accepted', 'rejected']) }).strict();

router.get('/', requireAuth, requirePermission('quotes:read'), async (request, response, next) => {
  try {
    const quotes = await Quote.find({ tenantId: request.authUser!.tenantId })
      .sort({ createdAt: -1 }).limit(500).lean();
    response.json({ data: quotes });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('quotes:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const customer = await Customer.findOne({ _id: input.customerId, tenantId, isActive: true });
    if (!customer) {
      response.status(400).json({ error: { code: 'INVALID_QUOTE_CUSTOMER', message: 'El cliente seleccionado no existe o está inactivo.' } });
      return;
    }
    const productIds = input.items.map((item) => new mongoose.Types.ObjectId(item.productId));
    const products = await Product.find({ _id: { $in: productIds }, tenantId, isActive: true });
    if (products.length !== input.items.length) {
      response.status(400).json({ error: { code: 'INVALID_QUOTE_PRODUCT', message: 'Uno o más productos no existen o están inactivos.' } });
      return;
    }
    const productById = new Map(products.map((product) => [product.id, product]));
    const year = new Date().getUTCFullYear();
    const sequence = await Sequence.findOneAndUpdate(
      { tenantId, kind: 'quote', year },
      { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'quote', year } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (!sequence) throw new Error('No se pudo generar el folio de cotización.');
    const items = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error('Producto no disponible al preparar la cotización.');
      const unitPrice = Math.round(product.price * 100) / 100;
      return {
        productId: product._id, sku: product.sku, name: product.name,
        unitPrice, quantity: item.quantity,
        lineTotal: Math.round(unitPrice * item.quantity * 100) / 100
      };
    });
    const quote = await Quote.create({
      tenantId,
      quoteNumber: `C-${year}-${String(sequence.value).padStart(6, '0')}`,
      customerId: customer._id,
      customerName: customer.name,
      items,
      total: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
      validUntil: input.validUntil ? new Date(`${input.validUntil}T23:59:59.999Z`) : undefined,
      createdBy: new mongoose.Types.ObjectId(request.authUser!.userId)
    });
    response.status(201).json({ data: quote.toObject() });
  } catch (error) { next(error); }
});

router.patch('/:quoteId', requireAuth, requirePermission('quotes:write'), async (request, response, next) => {
  try {
    const quoteId = request.params.quoteId;
    if (typeof quoteId !== 'string' || !mongoose.Types.ObjectId.isValid(quoteId)) {
      response.status(400).json({ error: { code: 'INVALID_QUOTE_ID', message: 'Invalid quote id' } });
      return;
    }
    const { status } = updateSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    const quote = await Quote.findOne({ _id: quoteId, tenantId });
    if (!quote) {
      response.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found' } });
      return;
    }
    const allowedTransitions: Record<typeof quote.status, string[]> = {
      draft: ['sent', 'rejected'],
      sent: ['accepted', 'rejected'],
      accepted: [],
      rejected: []
    };
    if (!allowedTransitions[quote.status].includes(status)) {
      response.status(409).json({ error: { code: 'INVALID_QUOTE_STATUS', message: 'La cotización no puede cambiar a ese estado.' } });
      return;
    }
    quote.status = status;
    await quote.save();
    response.json({ data: quote.toObject() });
  } catch (error) { next(error); }
});

export { router as quotesRouter };
