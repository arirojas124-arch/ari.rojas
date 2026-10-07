import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Department } from './people.models.js';

const router = Router();
const fields = { name: z.string().trim().min(2).max(100), description: z.string().trim().max(300).optional() };
const createSchema = z.object(fields).strict();
const updateSchema = z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict();
const publicFields = 'name description isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('departments:read'), async (request, response, next) => {
  try {
    response.json({ data: await Department.find({ tenantId: request.authUser!.tenantId }).select(publicFields).sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('departments:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (await Department.exists({ tenantId, name: input.name })) {
      response.status(409).json({ error: { code: 'DEPARTMENT_EXISTS', message: 'Ya existe un departamento con ese nombre.' } });
      return;
    }
    const department = await Department.create({ ...input, tenantId });
    response.status(201).json({ data: await Department.findById(department.id).select(publicFields).lean() });
  } catch (error) { next(error); }
});

router.patch('/:departmentId', requireAuth, requirePermission('departments:write'), async (request, response, next) => {
  try {
    const departmentId = request.params.departmentId;
    if (typeof departmentId !== 'string' || !mongoose.Types.ObjectId.isValid(departmentId)) {
      response.status(400).json({ error: { code: 'INVALID_DEPARTMENT_ID', message: 'Invalid department id' } });
      return;
    }
    const input = updateSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (input.name && await Department.exists({ tenantId, name: input.name, _id: { $ne: departmentId } })) {
      response.status(409).json({ error: { code: 'DEPARTMENT_EXISTS', message: 'Ya existe un departamento con ese nombre.' } });
      return;
    }
    const department = await Department.findOneAndUpdate({ _id: departmentId, tenantId }, { $set: input }, { new: true, runValidators: true }).select(publicFields).lean();
    if (!department) {
      response.status(404).json({ error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' } });
      return;
    }
    response.json({ data: department });
  } catch (error) { next(error); }
});

export { router as departmentsRouter };
