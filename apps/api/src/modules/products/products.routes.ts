import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Category } from '../categories/categories.model.js';
import { InventoryLevel } from '../inventory/inventory.models.js';
import { ensureLegacyInventory } from '../inventory/inventory.service.js';
import { Product } from './products.model.js';

const router = Router();

const productFields = {
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase()),
  description: z.string().trim().max(500).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional().or(z.literal('')),
  price: z.number().finite().min(0),
  stock: z.number().finite().min(0)
};

const createProductSchema = z.object(productFields).strict();
const updateProductSchema = z.object({
  name: productFields.name.optional(),
  sku: productFields.sku.optional(),
  description: productFields.description,
  categoryId: productFields.categoryId,
  price: productFields.price.optional(),
  isActive: z.boolean().optional()
}).partial().strict();
const publicProductFields = 'name sku description categoryId categoryName price stock isActive createdAt updatedAt';

router.get('/', requireAuth, requirePermission('products:read'), async (request, response, next) => {
  try {
    const products = await Product.find({ tenantId: request.authUser!.tenantId })
      .select(publicProductFields)
      .sort({ createdAt: -1 })
      .lean();
    response.json({ data: products });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requirePermission('products:write'), async (request, response, next) => {
  try {
    const input = createProductSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (await Product.exists({ tenantId, sku: input.sku })) {
      response.status(409).json({ error: { code: 'PRODUCT_SKU_EXISTS', message: 'A product with this SKU already exists' } });
      return;
    }

    const { categoryId, ...productInput } = input;
    const category = categoryId ? await Category.findOne({ _id: categoryId, tenantId, isActive: true }) : null;
    if (categoryId && !category) {
      response.status(400).json({ error: { code: 'INVALID_PRODUCT_CATEGORY', message: 'La categoría no existe o está inactiva.' } });
      return;
    }
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const warehouse = await ensureLegacyInventory(tenantObjectId);
    const session = await mongoose.startSession();
    let createdProduct: unknown;
    try {
      await session.withTransaction(async () => {
        const [product] = await Product.create([{
          ...productInput, tenantId: tenantObjectId, categoryId: category?._id,
          categoryName: category?.name, inventoryInitialized: true
        }], { session });
        if (!product) throw new Error('No se pudo crear el producto.');
        await InventoryLevel.create([{
          tenantId: tenantObjectId, warehouseId: warehouse._id,
          productId: product._id, quantity: product.stock
        }], { session });
        createdProduct = await Product.findById(product.id).select(publicProductFields).session(session).lean();
      });
    } finally {
      await session.endSession();
    }
    response.status(201).json({ data: createdProduct });
  } catch (error) {
    next(error);
  }
});

router.patch('/:productId', requireAuth, requirePermission('products:write'), async (request, response, next) => {
  try {
    const productId = request.params.productId;
    if (typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)) {
      response.status(400).json({ error: { code: 'INVALID_PRODUCT_ID', message: 'Invalid product id' } });
      return;
    }

    const input = updateProductSchema.parse(request.body);
    const tenantId = request.authUser!.tenantId;
    if (input.sku && await Product.exists({ tenantId, sku: input.sku, _id: { $ne: productId } })) {
      response.status(409).json({ error: { code: 'PRODUCT_SKU_EXISTS', message: 'A product with this SKU already exists' } });
      return;
    }

    const { categoryId, ...productInput } = input;
    const update: { $set: Record<string, unknown>; $unset?: Record<string, 1> } = { $set: productInput };
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await Category.findOne({ _id: categoryId, tenantId, isActive: true });
        if (!category) {
          response.status(400).json({ error: { code: 'INVALID_PRODUCT_CATEGORY', message: 'La categoría no existe o está inactiva.' } });
          return;
        }
        update.$set.categoryId = category._id;
        update.$set.categoryName = category.name;
      } else {
        update.$unset = { categoryId: 1, categoryName: 1 };
      }
    }
    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      update,
      { new: true, runValidators: true }
    ).select(publicProductFields).lean();

    if (!product) {
      response.status(404).json({ error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } });
      return;
    }

    response.json({ data: product });
  } catch (error) {
    next(error);
  }
});

export { router as productsRouter };
