import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../auth/auth.models.js';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';

const router = Router();
const roles = ['superadmin', 'company_admin', 'manager', 'employee', 'viewer'] as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(12).max(128),
  role: z.enum(roles).default('employee')
}).strict();

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional()
}).strict();

const publicUserFields = 'name email role isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('users:read'), async (request, response, next) => {
  try {
    const users = await User.find({ tenantId: request.authUser!.tenantId })
      .select(publicUserFields)
      .sort({ createdAt: -1 })
      .lean();

    response.json({ data: users });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requirePermission('users:write'), async (request, response, next) => {
  try {
    const input = createUserSchema.parse(request.body);
    const email = input.email.toLowerCase();
    const tenantId = request.authUser!.tenantId;
    const existingUser = await User.exists({ tenantId, email });

    if (existingUser) {
      response.status(409).json({ error: { code: 'USER_EXISTS', message: 'User email already exists in this company' } });
      return;
    }

    const user = await User.create({
      tenantId,
      name: input.name,
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role
    });

    response.status(201).json({
      data: await User.findById(user.id).select(publicUserFields).lean()
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:userId', requireAuth, requirePermission('users:write'), async (request, response, next) => {
  try {
    const userId = request.params.userId;
    if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      response.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'Invalid user id' } });
      return;
    }

    const input = updateUserSchema.parse(request.body);
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId: request.authUser!.tenantId },
      { $set: input },
      { new: true, runValidators: true }
    ).select(publicUserFields).lean();

    if (!user) {
      response.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    response.json({ data: user });
  } catch (error) {
    next(error);
  }
});

export { router as usersRouter };