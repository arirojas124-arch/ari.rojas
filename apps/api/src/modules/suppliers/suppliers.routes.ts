import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Supplier } from './suppliers.model.js';

const router = Router();

const supplierFields = {
  name: z.string().trim().min(2).max(120),
  contactName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(240).optional()
};

const createSupplierSchema = z.object(supplierFields).strict();
const updateSupplierSchema = z.object({
  ...supplierFields,
  isActive: z.boolean().optional()
}).partial().strict();
const publicSupplierFields = 'name contactName email phone address isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('suppliers:read'), async (request, response, next) => {
  try {
    const suppliers = await Supplier.find({ tenantId: request.authUser!.tenantId })
      .select(publicSupplierFields)
      .sort({ createdAt: -1 })
      .lean();
    response.json({ data: suppliers });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requirePermission('suppliers:write'), async (request, response, next) => {
  try {
    const input = createSupplierSchema.parse(request.body);
    const supplier = await Supplier.create({ ...input, tenantId: request.authUser!.tenantId });
    response.status(201).json({
      data: await Supplier.findById(supplier.id).select(publicSupplierFields).lean()
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:supplierId', requireAuth, requirePermission('suppliers:write'), async (request, response, next) => {
  try {
    const supplierId = request.params.supplierId;
    if (typeof supplierId !== 'string' || !mongoose.Types.ObjectId.isValid(supplierId)) {
      response.status(400).json({ error: { code: 'INVALID_SUPPLIER_ID', message: 'Invalid supplier id' } });
      return;
    }

    const input = updateSupplierSchema.parse(request.body);
    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, tenantId: request.authUser!.tenantId },
      { $set: input },
      { new: true, runValidators: true }
    ).select(publicSupplierFields).lean();

    if (!supplier) {
      response.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier not found' } });
      return;
    }

    response.json({ data: supplier });
  } catch (error) {
    next(error);
  }
});

export { router as suppliersRouter };
