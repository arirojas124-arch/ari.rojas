import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { InventoryLevel } from '../inventory/inventory.models.js';
import { Warehouse } from './warehouses.model.js';

const router = Router();
const fields = {
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()),
  address: z.string().trim().max(240).optional()
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict();
const publicFields = 'name code address isActive isDefault createdAt updatedAt';

router.get('/', requireAuth, requirePermission('warehouses:read'), async (request, response, next) => {
  try {
    const warehouses = await Warehouse.find({ tenantId: request.authUser!.tenantId })
      .select(publicFields).sort({ isDefault: -1, name: 1 }).lean();
    response.json({ data: warehouses });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('warehouses:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (await Warehouse.exists({ tenantId, code: input.code })) {
      response.status(409).json({ error: { code: 'WAREHOUSE_CODE_EXISTS', message: 'Ya existe un almacén con ese código.' } });
      return;
    }
    const warehouse = await Warehouse.create({ ...input, tenantId });
    response.status(201).json({ data: await Warehouse.findById(warehouse.id).select(publicFields).lean() });
  } catch (error) { next(error); }
});

router.patch('/:warehouseId', requireAuth, requirePermission('warehouses:write'), async (request, response, next) => {
  try {
    const warehouseId = request.params.warehouseId;
    if (typeof warehouseId !== 'string' || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      response.status(400).json({ error: { code: 'INVALID_WAREHOUSE_ID', message: 'Invalid warehouse id' } });
      return;
    }
    const input = updateSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (input.code && await Warehouse.exists({ tenantId, code: input.code, _id: { $ne: warehouseId } })) {
      response.status(409).json({ error: { code: 'WAREHOUSE_CODE_EXISTS', message: 'Ya existe un almacén con ese código.' } });
      return;
    }
    if (input.isActive === false && await Warehouse.exists({ _id: warehouseId, tenantId, isDefault: true })) {
      response.status(400).json({ error: { code: 'DEFAULT_WAREHOUSE_REQUIRED', message: 'El almacén principal no se puede desactivar.' } });
      return;
    }
    if (input.isActive === false && await InventoryLevel.exists({ tenantId, warehouseId, quantity: { $gt: 0 } })) {
      response.status(409).json({ error: { code: 'WAREHOUSE_HAS_STOCK', message: 'Traslada las existencias antes de desactivar el almacén.' } });
      return;
    }
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: warehouseId, tenantId }, { $set: input }, { new: true, runValidators: true }
    ).select(publicFields).lean();
    if (!warehouse) {
      response.status(404).json({ error: { code: 'WAREHOUSE_NOT_FOUND', message: 'Warehouse not found' } });
      return;
    }
    response.json({ data: warehouse });
  } catch (error) { next(error); }
});

export { router as warehousesRouter };
