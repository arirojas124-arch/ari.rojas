import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Department, Employee } from './people.models.js';

const router = Router();
const fields = {
  employeeNumber: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  departmentId: z.string().regex(/^[a-f\d]{24}$/i).optional().or(z.literal('')),
  jobTitle: z.string().trim().max(100).optional(),
  startDate: z.string().datetime().optional()
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict();
const publicFields = 'employeeNumber name email phone departmentId departmentName jobTitle startDate isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('employees:read'), async (request, response, next) => {
  try {
    response.json({ data: await Employee.find({ tenantId: request.authUser!.tenantId }).select(publicFields).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('employees:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    if (await Employee.exists({ tenantId, employeeNumber: input.employeeNumber })) {
      response.status(409).json({ error: { code: 'EMPLOYEE_NUMBER_EXISTS', message: 'Ya existe un empleado con ese número.' } });
      return;
    }
    const { departmentId, startDate, ...rest } = input;
    const department = departmentId ? await Department.findOne({ _id: departmentId, tenantId, isActive: true }) : null;
    if (departmentId && !department) {
      response.status(400).json({ error: { code: 'INVALID_EMPLOYEE_DEPARTMENT', message: 'El departamento no existe o está inactivo.' } });
      return;
    }
    const employee = await Employee.create({
      ...rest, tenantId, departmentId: department?._id, departmentName: department?.name,
      ...(startDate ? { startDate: new Date(startDate) } : {})
    });
    response.status(201).json({ data: await Employee.findById(employee.id).select(publicFields).lean() });
  } catch (error) { next(error); }
});

router.patch('/:employeeId', requireAuth, requirePermission('employees:write'), async (request, response, next) => {
  try {
    const employeeId = request.params.employeeId;
    if (typeof employeeId !== 'string' || !mongoose.Types.ObjectId.isValid(employeeId)) {
      response.status(400).json({ error: { code: 'INVALID_EMPLOYEE_ID', message: 'Invalid employee id' } });
      return;
    }
    const input = updateSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    if (input.employeeNumber && await Employee.exists({ tenantId, employeeNumber: input.employeeNumber, _id: { $ne: employeeId } })) {
      response.status(409).json({ error: { code: 'EMPLOYEE_NUMBER_EXISTS', message: 'Ya existe un empleado con ese número.' } });
      return;
    }
    const { departmentId, startDate, ...rest } = input;
    const update: { $set: Record<string, unknown>; $unset?: Record<string, 1> } = {
      $set: { ...rest, ...(startDate ? { startDate: new Date(startDate) } : {}) }
    };
    if (departmentId !== undefined) {
      if (departmentId) {
        const department = await Department.findOne({ _id: departmentId, tenantId, isActive: true });
        if (!department) {
          response.status(400).json({ error: { code: 'INVALID_EMPLOYEE_DEPARTMENT', message: 'El departamento no existe o está inactivo.' } });
          return;
        }
        update.$set.departmentId = department._id;
        update.$set.departmentName = department.name;
      } else update.$unset = { departmentId: 1, departmentName: 1 };
    }
    const employee = await Employee.findOneAndUpdate({ _id: employeeId, tenantId }, update, { new: true, runValidators: true }).select(publicFields).lean();
    if (!employee) {
      response.status(404).json({ error: { code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' } });
      return;
    }
    response.json({ data: employee });
  } catch (error) { next(error); }
});

export { router as employeesRouter };
