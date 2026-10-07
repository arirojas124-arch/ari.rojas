import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Employee } from '../people/people.models.js';
import { Project, Task } from './projects.models.js';

const projectsRouter = Router();
const tasksRouter = Router();
const projectFields = {
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(['planned', 'active', 'completed', 'on_hold']).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional()
};
const createProjectSchema = z.object({
  ...projectFields,
  status: projectFields.status.default('planned')
}).strict();
const updateProjectSchema = z.object({ ...projectFields, isActive: z.boolean().optional() }).partial().strict();
const taskFields = {
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedEmployeeId: z.string().regex(/^[a-f\d]{24}$/i).optional().or(z.literal(''))
};
const createTaskSchema = z.object({
  ...taskFields,
  status: taskFields.status.default('todo')
}).strict();
const updateTaskSchema = z.object({ ...taskFields, isActive: z.boolean().optional() }).partial().strict();
const projectPublicFields = 'name description status startDate dueDate isActive createdAt updatedAt';
const taskPublicFields = 'projectId projectName title description status dueDate assignedEmployeeId assignedEmployeeName isActive createdAt updatedAt';

projectsRouter.get('/', requireAuth, requirePermission('projects:read'), async (request, response, next) => {
  try {
    response.json({ data: await Project.find({ tenantId: request.authUser!.tenantId }).select(projectPublicFields).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});

projectsRouter.post('/', requireAuth, requirePermission('projects:write'), async (request, response, next) => {
  try {
    const input = createProjectSchema.parse(request.body);
    const project = await Project.create({
      ...input,
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
      tenantId: request.authUser!.tenantId,
      createdBy: request.authUser!.userId
    });
    response.status(201).json({ data: await Project.findById(project.id).select(projectPublicFields).lean() });
  } catch (error) { next(error); }
});

projectsRouter.patch('/:projectId', requireAuth, requirePermission('projects:write'), async (request, response, next) => {
  try {
    const projectId = request.params.projectId;
    if (typeof projectId !== 'string' || !mongoose.Types.ObjectId.isValid(projectId)) {
      response.status(400).json({ error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project id' } });
      return;
    }
    const input = updateProjectSchema.parse(request.body);
    const update = {
      ...input,
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {})
    };
    const project = await Project.findOneAndUpdate({ _id: projectId, tenantId: request.authUser!.tenantId }, { $set: update }, { new: true, runValidators: true }).select(projectPublicFields).lean();
    if (!project) {
      response.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
      return;
    }
    response.json({ data: project });
  } catch (error) { next(error); }
});

tasksRouter.get('/', requireAuth, requirePermission('projects:read'), async (request, response, next) => {
  try {
    response.json({ data: await Task.find({ tenantId: request.authUser!.tenantId }).select(taskPublicFields).sort({ createdAt: -1 }).limit(1000).lean() });
  } catch (error) { next(error); }
});

tasksRouter.post('/', requireAuth, requirePermission('projects:write'), async (request, response, next) => {
  try {
    const input = createTaskSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const project = await Project.findOne({ _id: input.projectId, tenantId, isActive: true });
    if (!project) {
      response.status(400).json({ error: { code: 'INVALID_TASK_PROJECT', message: 'El proyecto no existe o está inactivo.' } });
      return;
    }
    const employee = input.assignedEmployeeId
      ? await Employee.findOne({ _id: input.assignedEmployeeId, tenantId, isActive: true })
      : null;
    if (input.assignedEmployeeId && !employee) {
      response.status(400).json({ error: { code: 'INVALID_TASK_ASSIGNEE', message: 'El empleado asignado no existe o está inactivo.' } });
      return;
    }
    const task = await Task.create({
      ...input, tenantId, projectId: project._id, projectName: project.name,
      ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
      ...(employee ? { assignedEmployeeId: employee._id, assignedEmployeeName: employee.name } : {}),
      createdBy: request.authUser!.userId
    });
    response.status(201).json({ data: await Task.findById(task.id).select(taskPublicFields).lean() });
  } catch (error) { next(error); }
});

tasksRouter.patch('/:taskId', requireAuth, requirePermission('projects:write'), async (request, response, next) => {
  try {
    const taskId = request.params.taskId;
    if (typeof taskId !== 'string' || !mongoose.Types.ObjectId.isValid(taskId)) {
      response.status(400).json({ error: { code: 'INVALID_TASK_ID', message: 'Invalid task id' } });
      return;
    }
    const input = updateTaskSchema.parse(request.body);
    const tenantId = new mongoose.Types.ObjectId(request.authUser!.tenantId);
    const { projectId, assignedEmployeeId, dueDate, ...taskFieldsToSet } = input;
    const update: { $set: Record<string, unknown>; $unset?: Record<string, 1> } = {
      $set: {
        ...taskFieldsToSet,
        ...(dueDate ? { dueDate: new Date(dueDate) } : {})
      }
    };
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, tenantId, isActive: true });
      if (!project) {
        response.status(400).json({ error: { code: 'INVALID_TASK_PROJECT', message: 'El proyecto no existe o está inactivo.' } });
        return;
      }
      update.$set.projectId = project._id;
      update.$set.projectName = project.name;
    }
    if (assignedEmployeeId !== undefined) {
      if (assignedEmployeeId) {
        const employee = await Employee.findOne({ _id: assignedEmployeeId, tenantId, isActive: true });
        if (!employee) {
          response.status(400).json({ error: { code: 'INVALID_TASK_ASSIGNEE', message: 'El empleado asignado no existe o está inactivo.' } });
          return;
        }
        update.$set.assignedEmployeeId = employee._id;
        update.$set.assignedEmployeeName = employee.name;
      } else update.$unset = { assignedEmployeeId: 1, assignedEmployeeName: 1 };
    }
    const task = await Task.findOneAndUpdate({ _id: taskId, tenantId }, update, { new: true, runValidators: true }).select(taskPublicFields).lean();
    if (!task) {
      response.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      return;
    }
    response.json({ data: task });
  } catch (error) { next(error); }
});

export { projectsRouter, tasksRouter };
