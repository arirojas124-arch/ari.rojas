import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Customer } from '../customers/customers.model.js';
import { Invoice } from '../invoices/invoices.model.js';
import { Product } from '../products/products.model.js';
import { Sale } from './sales.model.js';
import { Sequence } from './sequence.model.js';

const router = Router();

const createSaleSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive().max(1_000_000)
  }).strict()).min(1).max(100)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'No repitas productos; actualiza la cantidad en su renglón.')
}).strict();

router.get('/', requireAuth, requirePermission('sales:read'), async (request, response, next) => {
  try {
    const sales = await Sale.find({ tenantId: request.authUser!.tenantId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    response.json({ data: sales });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requirePermission('sales:write'), async (request, response, next) => {
  const inputResult = createSaleSchema.safeParse(request.body);
  if (!inputResult.success) {
    next(inputResult.error);
    return;
  }

  const input = inputResult.data;
  const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
  const userId = new mongoose.Types.ObjectId(request.authUser!.userId);
  const customerId = new mongoose.Types.ObjectId(input.customerId);
  const session = await mongoose.startSession();
  let responseData: { sale: unknown; invoice: unknown } | undefined;

  try {
    await session.withTransaction(async () => {
      const customer = await Customer.findOne({ _id: customerId, tenantId, isActive: true }).session(session);
      if (!customer) {
        const error = new Error('El cliente seleccionado no existe o está inactivo.');
        error.name = 'INVALID_SALE_CUSTOMER';
        throw error;
      }

      const productIds = input.items.map((item) => new mongoose.Types.ObjectId(item.productId));
      const products = await Product.find({ _id: { $in: productIds }, tenantId, isActive: true }).session(session);
      if (products.length !== input.items.length) {
        const error = new Error('Uno o más productos no existen o están inactivos.');
        error.name = 'INVALID_SALE_PRODUCT';
        throw error;
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      const year = new Date().getUTCFullYear();
      const saleSequence = await Sequence.findOneAndUpdate(
        { tenantId, kind: 'sale', year },
        { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'sale', year } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );
      const invoiceSequence = await Sequence.findOneAndUpdate(
        { tenantId, kind: 'invoice', year },
        { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'invoice', year } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );
      if (!saleSequence || !invoiceSequence) {
        throw new Error('No se pudieron generar los folios de venta y factura.');
      }

      const saleNumber = `V-${year}-${String(saleSequence.value).padStart(6, '0')}`;
      const invoiceNumber = `F-${year}-${String(invoiceSequence.value).padStart(6, '0')}`;
      const items = input.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product) throw new Error('Producto no disponible al preparar la venta.');
        const unitPrice = Math.round(product.price * 100) / 100;
        return {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal: Math.round(unitPrice * item.quantity * 100) / 100
        };
      });
      const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

      for (const item of items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, tenantId, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!updatedProduct) {
          const error = new Error(`Existencia insuficiente para ${item.name}.`);
          error.name = 'INSUFFICIENT_STOCK';
          throw error;
        }
      }

      const [sale] = await Sale.create([{
        tenantId,
        saleNumber,
        customerId,
        customerName: customer.name,
        items,
        total,
        createdBy: userId
      }], { session });
      if (!sale) throw new Error('No se pudo guardar la venta.');
      const [invoice] = await Invoice.create([{
        tenantId,
        invoiceNumber,
        saleId: sale._id,
        saleNumber,
        customerId,
        customerName: customer.name,
        total,
        status: 'pending'
      }], { session });
      if (!invoice) throw new Error('No se pudo generar la factura interna.');
      responseData = { sale: sale.toObject(), invoice: invoice.toObject() };
    });

    if (!responseData) throw new Error('La venta no pudo completarse.');
    response.status(201).json({ data: responseData });
  } catch (error) {
    if (error instanceof Error && error.name === 'INVALID_SALE_CUSTOMER') {
      response.status(400).json({ error: { code: 'INVALID_SALE_CUSTOMER', message: error.message } });
      return;
    }
    if (error instanceof Error && error.name === 'INVALID_SALE_PRODUCT') {
      response.status(400).json({ error: { code: 'INVALID_SALE_PRODUCT', message: error.message } });
      return;
    }
    if (error instanceof Error && error.name === 'INSUFFICIENT_STOCK') {
      response.status(409).json({ error: { code: 'INSUFFICIENT_STOCK', message: error.message } });
      return;
    }
    next(error);
  } finally {
    await session.endSession();
  }
});

export { router as salesRouter };
