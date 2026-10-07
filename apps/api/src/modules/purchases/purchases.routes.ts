import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { InventoryLevel, InventoryMovement } from '../inventory/inventory.models.js';
import { ensureLegacyInventory } from '../inventory/inventory.service.js';
import { Product } from '../products/products.model.js';
import { Sequence } from '../sales/sequence.model.js';
import { Supplier } from '../suppliers/suppliers.model.js';
import { Warehouse } from '../warehouses/warehouses.model.js';
import { PurchaseOrder, Receipt } from './purchases.models.js';

const ordersRouter = Router();
const receiptsRouter = Router();
const createOrderSchema = z.object({
  supplierId: z.string().regex(/^[a-f\d]{24}$/i),
  warehouseId: z.string().regex(/^[a-f\d]{24}$/i),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive().max(1_000_000),
    unitCost: z.number().finite().min(0)
  }).strict()).min(1).max(100)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'No repitas productos.')
}).strict();
const receiptSchema = z.object({
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive().max(1_000_000)
  }).strict()).min(1).max(100)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'No repitas productos.')
}).strict();
const paymentSchema = z.object({ paidAmount: z.number().finite().min(0) }).strict();

ordersRouter.get('/', requireAuth, requirePermission('purchases:read'), async (request, response, next) => {
  try {
    const rows = await PurchaseOrder.find({ tenantId: request.authUser!.tenantId }).sort({ createdAt: -1 }).limit(500).lean();
    response.json({ data: rows });
  } catch (error) { next(error); }
});

ordersRouter.post('/', requireAuth, requirePermission('purchases:write'), async (request, response, next) => {
  try {
    const input = createOrderSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const [supplier, warehouse] = await Promise.all([
      Supplier.findOne({ _id: input.supplierId, tenantId, isActive: true }),
      Warehouse.findOne({ _id: input.warehouseId, tenantId, isActive: true })
    ]);
    if (!supplier || !warehouse) {
      response.status(400).json({ error: { code: 'INVALID_PURCHASE_REFERENCE', message: 'El proveedor o almacén no existe o está inactivo.' } });
      return;
    }
    const productIds = input.items.map((item) => new mongoose.Types.ObjectId(item.productId));
    const products = await Product.find({ _id: { $in: productIds }, tenantId, isActive: true });
    if (products.length !== input.items.length) {
      response.status(400).json({ error: { code: 'INVALID_PURCHASE_PRODUCT', message: 'Uno o más productos no existen o están inactivos.' } });
      return;
    }
    const byId = new Map(products.map((product) => [product.id, product]));
    const year = new Date().getUTCFullYear();
    const sequence = await Sequence.findOneAndUpdate(
      { tenantId, kind: 'purchase_order', year },
      { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'purchase_order', year } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (!sequence) throw new Error('No se pudo generar el folio de orden.');
    const items = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error('Producto no disponible al preparar la orden.');
      return { productId: product._id, sku: product.sku, name: product.name, quantity: item.quantity, unitCost: item.unitCost, receivedQuantity: 0 };
    });
    const order = await PurchaseOrder.create({
      tenantId, orderNumber: `OC-${year}-${String(sequence.value).padStart(6, '0')}`,
      supplierId: supplier._id, supplierName: supplier.name, warehouseId: warehouse._id,
      items, total: Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0) * 100) / 100,
      createdBy: new mongoose.Types.ObjectId(request.authUser!.userId)
    });
    response.status(201).json({ data: order.toObject() });
  } catch (error) { next(error); }
});

ordersRouter.post('/:orderId/receipts', requireAuth, requirePermission('purchases:write'), async (request, response, next) => {
  const parsed = receiptSchema.safeParse(request.body);
  if (!parsed.success) { next(parsed.error); return; }
  const orderId = request.params.orderId;
  if (typeof orderId !== 'string' || !mongoose.Types.ObjectId.isValid(orderId)) {
    response.status(400).json({ error: { code: 'INVALID_PURCHASE_ORDER_ID', message: 'Invalid purchase order id' } });
    return;
  }
  const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
  const session = await mongoose.startSession();
  let createdReceipt: unknown;
  try {
    await ensureLegacyInventory(tenantId);
    await session.withTransaction(async () => {
      const order = await PurchaseOrder.findOne({ _id: orderId, tenantId }).session(session);
      if (!order || order.status === 'cancelled' || order.status === 'received') {
        const error = new Error('La orden no existe o ya no acepta recepciones.');
        error.name = 'INVALID_PURCHASE_ORDER';
        throw error;
      }
      const receiptItems = parsed.data.items.map((input) => {
        const line = order.items.find((item) => item.productId.toString() === input.productId);
        if (!line || line.receivedQuantity + input.quantity > line.quantity) {
          const error = new Error('La cantidad recibida no puede superar la cantidad pendiente de la orden.');
          error.name = 'INVALID_RECEIPT_QUANTITY';
          throw error;
        }
        return { line, quantity: input.quantity };
      });
      const year = new Date().getUTCFullYear();
      const sequence = await Sequence.findOneAndUpdate(
        { tenantId, kind: 'receipt', year },
        { $inc: { value: 1 }, $setOnInsert: { tenantId, kind: 'receipt', year } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );
      if (!sequence) throw new Error('No se pudo generar el folio de recepción.');
      for (const { line, quantity } of receiptItems) {
        const level = await InventoryLevel.findOneAndUpdate(
          { tenantId, warehouseId: order.warehouseId, productId: line.productId },
          { $inc: { quantity } },
          { new: true, session }
        );
        const product = await Product.findOneAndUpdate(
          { _id: line.productId, tenantId, isActive: true },
          { $inc: { stock: quantity } },
          { new: true, session }
        );
        if (!level || !product) throw new Error('No se pudo actualizar el inventario de la recepción.');
        line.receivedQuantity += quantity;
        await InventoryMovement.create([{
          tenantId, warehouseId: order.warehouseId, productId: line.productId,
          quantityChange: quantity, reason: `Recepción ${order.orderNumber}`,
          createdBy: new mongoose.Types.ObjectId(request.authUser!.userId)
        }], { session });
      }
      order.status = order.items.every((item) => item.receivedQuantity === item.quantity) ? 'received' : 'partially_received';
      await order.save({ session });
      const [receipt] = await Receipt.create([{
        tenantId, receiptNumber: `REC-${year}-${String(sequence.value).padStart(6, '0')}`,
        purchaseOrderId: order._id, orderNumber: order.orderNumber, warehouseId: order.warehouseId,
        items: receiptItems.map(({ line, quantity }) => ({ productId: line.productId, sku: line.sku, name: line.name, quantity })),
        receivedBy: new mongoose.Types.ObjectId(request.authUser!.userId)
      }], { session });
      createdReceipt = receipt?.toObject();
    });
    response.status(201).json({ data: createdReceipt });
  } catch (error) {
    if (error instanceof Error && ['INVALID_PURCHASE_ORDER', 'INVALID_RECEIPT_QUANTITY'].includes(error.name)) {
      response.status(409).json({ error: { code: error.name, message: error.message } });
      return;
    }
    next(error);
  } finally { await session.endSession(); }
});

ordersRouter.patch('/:orderId/payment', requireAuth, requirePermission('finance:write'), async (request, response, next) => {
  try {
    const orderId = request.params.orderId;
    if (typeof orderId !== 'string' || !mongoose.Types.ObjectId.isValid(orderId)) {
      response.status(400).json({ error: { code: 'INVALID_PURCHASE_ORDER_ID', message: 'Invalid purchase order id' } });
      return;
    }
    const { paidAmount } = paymentSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    const order = await PurchaseOrder.findOne({ _id: orderId, tenantId });
    if (!order) {
      response.status(404).json({ error: { code: 'PURCHASE_ORDER_NOT_FOUND', message: 'Purchase order not found' } });
      return;
    }
    if (paidAmount > order.total) {
      response.status(400).json({ error: { code: 'PAYMENT_EXCEEDS_PURCHASE', message: 'El pago no puede superar el total de la orden.' } });
      return;
    }
    order.paidAmount = paidAmount;
    order.paymentStatus = paidAmount === 0 ? 'pending' : paidAmount >= order.total ? 'paid' : 'partial';
    await order.save();
    response.json({ data: order.toObject() });
  } catch (error) { next(error); }
});

receiptsRouter.get('/', requireAuth, requirePermission('purchases:read'), async (request, response, next) => {
  try {
    const rows = await Receipt.find({ tenantId: request.authUser!.tenantId }).sort({ createdAt: -1 }).limit(500).lean();
    response.json({ data: rows });
  } catch (error) { next(error); }
});

export { ordersRouter as purchaseOrdersRouter, receiptsRouter };
