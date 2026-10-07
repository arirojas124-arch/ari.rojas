import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Attendance, Employee } from './people.models.js';

const router = Router();
const createSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i),
  workDate: z.string().date(),
  status: z.enum(['present', 'absent', 'leave']),
  notes: z.string().trim().max(300).optional()
}).strict();

router.get('/', requireAuth, requirePermission('attendance:read'), async (request, response, next) => {
  try {
    response.json({ data: await Attendance.find({ tenantId: request.authUser!.tenantId }).sort({ workDate: -1 }).limit(1000).lean() });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('attendance:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    const employee = await Employee.findOne({ _id: input.employeeId, tenantId, isActive: true });
    if (!employee) {
      response.status(400).json({ error: { code: 'INVALID_ATTENDANCE_EMPLOYEE', message: 'El empleado no existe o está inactivo.' } });
      return;
    }
    const workDate = new Date(`${input.workDate}T00:00:00.000Z`);
    const existing = await Attendance.findOne({ tenantId, employeeId: employee._id, workDate });
    const attendance = existing
      ? await Attendance.findOneAndUpdate({ _id: existing._id, tenantId }, {
        $set: { status: input.status, notes: input.notes, recordedBy: request.authUser!.userId }
      }, { new: true, runValidators: true })
      : await Attendance.create({
        ...input, tenantId, employeeId: employee._id, employeeName: employee.name,
        workDate, recordedBy: request.authUser!.userId
      });
    response.status(existing ? 200 : 201).json({ data: attendance?.toObject() });
  } catch (error) { next(error); }
});

router.patch('/:attendanceId', requireAuth, requirePermission('attendance:write'), async (request, response, next) => {
  try {
    const attendanceId = request.params.attendanceId;
    if (typeof attendanceId !== 'string' || !mongoose.Types.ObjectId.isValid(attendanceId)) {
      response.status(400).json({ error: { code: 'INVALID_ATTENDANCE_ID', message: 'Invalid attendance id' } });
      return;
    }
    const input = createSchema.pick({ status: true, notes: true }).partial().strict().parse(request.body);
    const attendance = await Attendance.findOneAndUpdate(
      { _id: attendanceId, tenantId: request.authUser!.tenantId },
      { $set: { ...input, recordedBy: request.authUser!.userId } }, { new: true, runValidators: true }
    ).lean();
    if (!attendance) {
      response.status(404).json({ error: { code: 'ATTENDANCE_NOT_FOUND', message: 'Attendance record not found' } });
      return;
    }
    response.json({ data: attendance });
  } catch (error) { next(error); }
});

export { router as attendanceRouter };
