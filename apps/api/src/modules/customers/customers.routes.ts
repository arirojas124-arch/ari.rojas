import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Customer } from './customers.model.js';

const router = Router();

const customerFields = {
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(240).optional()
};

const createCustomerSchema = z.object(customerFields).strict();
const updateCustomerSchema = z.object({
  ...customerFields,
  isActive: z.boolean().optional()
}).partial().strict();
const publicCustomerFields = 'name email phone address isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('customers:read'), async (request, response, next) => {
  try {
    const customers = await Customer.find({ tenantId: request.authUser!.tenantId })
      .select(publicCustomerFields)
      .sort({ createdAt: -1 })
      .lean();
    response.json({ data: customers });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requirePermission('customers:write'), async (request, response, next) => {
  try {
    const input = createCustomerSchema.parse(request.body);
    const customer = await Customer.create({ ...input, tenantId: request.authUser!.tenantId });
    response.status(201).json({
      data: await Customer.findById(customer.id).select(publicCustomerFields).lean()
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:customerId', requireAuth, requirePermission('customers:write'), async (request, response, next) => {
  try {
    const customerId = request.params.customerId;
    if (typeof customerId !== 'string' || !mongoose.Types.ObjectId.isValid(customerId)) {
      response.status(400).json({ error: { code: 'INVALID_CUSTOMER_ID', message: 'Invalid customer id' } });
      return;
    }

    const input = updateCustomerSchema.parse(request.body);
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, tenantId: request.authUser!.tenantId },
      { $set: input },
      { new: true, runValidators: true }
    ).select(publicCustomerFields).lean();

    if (!customer) {
      response.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' } });
      return;
    }

    response.json({ data: customer });
  } catch (error) {
    next(error);
  }
});

export { router as customersRouter };
