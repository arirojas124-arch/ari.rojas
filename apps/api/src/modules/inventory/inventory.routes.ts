import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Product } from '../products/products.model.js';
import { Warehouse } from '../warehouses/warehouses.model.js';
import { InventoryLevel, InventoryMovement } from './inventory.models.js';
import { ensureLegacyInventory } from './inventory.service.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const adjustmentSchema = z.object({
  warehouseId: objectId,
  productId: objectId,
  quantityChange: z.number().int().refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(240)
}).strict();

router.get('/', requireAuth, requirePermission('inventory:read'), async (request, response, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    await ensureLegacyInventory(tenantId);
    const filter: Record<string, unknown> = { tenantId };
    if (typeof request.query.warehouseId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(request.query.warehouseId)) {
        response.status(400).json({ error: { code: 'INVALID_WAREHOUSE_ID', message: 'Invalid warehouse id' } });
        return;
      }
      filter.warehouseId = new mongoose.Types.ObjectId(request.query.warehouseId);
    }
    const [levels, warehouses, products] = await Promise.all([
      InventoryLevel.find(filter).lean(),
      Warehouse.find({ tenantId }).select('name code isActive').lean(),
      Product.find({ tenantId, isActive: true }).select('name sku price stock isActive').lean()
    ]);
    const warehouseById = new Map(warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]));
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    response.json({ data: levels.flatMap((level) => {
      const warehouse = warehouseById.get(level.warehouseId.toString());
      const product = productById.get(level.productId.toString());
      return warehouse && product ? [{
        _id: level._id,
        warehouseId: level.warehouseId,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        productId: level.productId,
        productName: product.name,
        sku: product.sku,
        productStock: product.stock,
        quantity: level.quantity
      }] : [];
    }) });
  } catch (error) { next(error); }
});

router.post('/adjustments', requireAuth, requirePermission('inventory:write'), async (request, response, next) => {
  const parsed = adjustmentSchema.safeParse(request.body);
  if (!parsed.success) { next(parsed.error); return; }
  const input = parsed.data;
  const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
  const session = await mongoose.startSession();
  try {
    await ensureLegacyInventory(tenantId);
    let result: unknown;
    await session.withTransaction(async () => {
      const [warehouse, product] = await Promise.all([
        Warehouse.findOne({ _id: input.warehouseId, tenantId, isActive: true }).session(session),
        Product.findOne({ _id: input.productId, tenantId, isActive: true }).session(session)
      ]);
      if (!warehouse || !product) {
        const error = new Error('El producto o almacén no existe o está inactivo.');
        error.name = 'INVALID_INVENTORY_REFERENCE';
        throw error;
      }
      const lowerBound = -input.quantityChange;
      const levelFilter: Record<string, unknown> = {
        tenantId, warehouseId: warehouse._id, productId: product._id
      };
      if (input.quantityChange < 0) levelFilter.quantity = { $gte: lowerBound };
      const level = await InventoryLevel.findOneAndUpdate(
        levelFilter,
        { $inc: { quantity: input.quantityChange } },
        { new: true, session }
      );
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, tenantId, stock: { $gte: lowerBound } },
        { $inc: { stock: input.quantityChange } },
        { new: true, session }
      );
      if (!level || !updatedProduct) {
        const error = new Error('La cantidad ajustada excede las existencias disponibles.');
        error.name = 'INSUFFICIENT_INVENTORY';
        throw error;
      }
      const [movement] = await InventoryMovement.create([{
        tenantId, warehouseId: warehouse._id, productId: product._id,
        quantityChange: input.quantityChange, reason: input.reason,
        createdBy: new mongoose.Types.ObjectId(request.authUser!.userId)
      }], { session });
      result = { movement: movement?.toObject(), quantity: level.quantity, productStock: updatedProduct.stock };
    });
    response.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.name === 'INVALID_INVENTORY_REFERENCE') {
      response.status(400).json({ error: { code: error.name, message: error.message } });
      return;
    }
    if (error instanceof Error && error.name === 'INSUFFICIENT_INVENTORY') {
      response.status(409).json({ error: { code: error.name, message: error.message } });
      return;
    }
    next(error);
  } finally { await session.endSession(); }
});

router.get('/movements', requireAuth, requirePermission('inventory:read'), async (request, response, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const [movements, warehouses, products] = await Promise.all([
      InventoryMovement.find({ tenantId }).sort({ createdAt: -1 }).limit(500).lean(),
      Warehouse.find({ tenantId }).select('name code').lean(),
      Product.find({ tenantId }).select('name sku').lean()
    ]);
    const warehouseById = new Map(warehouses.map((item) => [item._id.toString(), item]));
    const productById = new Map(products.map((item) => [item._id.toString(), item]));
    response.json({ data: movements.flatMap((movement) => {
      const warehouse = warehouseById.get(movement.warehouseId.toString());
      const product = productById.get(movement.productId.toString());
      return warehouse && product ? [{
        _id: movement._id, createdAt: movement.createdAt, quantityChange: movement.quantityChange,
        reason: movement.reason, warehouseName: warehouse.name, warehouseCode: warehouse.code,
        productName: product.name, sku: product.sku
      }] : [];
    }) });
  } catch (error) { next(error); }
});

export { router as inventoryRouter };
