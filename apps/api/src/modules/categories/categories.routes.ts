import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Category } from './categories.model.js';

const router = Router();
const fields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional()
};
const createSchema = z.object(fields).strict();
const updateSchema = z.object({ ...fields, isActive: z.boolean().optional() }).partial().strict();
const publicFields = 'name description isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('categories:read'), async (request, response, next) => {
  try {
    const categories = await Category.find({ tenantId: request.authUser!.tenantId })
      .select(publicFields).sort({ name: 1 }).lean();
    response.json({ data: categories });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requirePermission('categories:write'), async (request, response, next) => {
  try {
    const input = createSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (await Category.exists({ tenantId, name: input.name })) {
      response.status(409).json({ error: { code: 'CATEGORY_EXISTS', message: 'Ya existe una categoría con ese nombre.' } });
      return;
    }
    const category = await Category.create({ ...input, tenantId });
    response.status(201).json({ data: await Category.findById(category.id).select(publicFields).lean() });
  } catch (error) { next(error); }
});

router.patch('/:categoryId', requireAuth, requirePermission('categories:write'), async (request, response, next) => {
  try {
    const categoryId = request.params.categoryId;
    if (typeof categoryId !== 'string' || !mongoose.Types.ObjectId.isValid(categoryId)) {
      response.status(400).json({ error: { code: 'INVALID_CATEGORY_ID', message: 'Invalid category id' } });
      return;
    }
    const input = updateSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (input.name && await Category.exists({ tenantId, name: input.name, _id: { $ne: categoryId } })) {
      response.status(409).json({ error: { code: 'CATEGORY_EXISTS', message: 'Ya existe una categoría con ese nombre.' } });
      return;
    }
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, tenantId }, { $set: input }, { new: true, runValidators: true }
    ).select(publicFields).lean();
    if (!category) {
      response.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' } });
      return;
    }
    response.json({ data: category });
  } catch (error) { next(error); }
});

export { router as categoriesRouter };
