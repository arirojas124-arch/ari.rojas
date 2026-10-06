import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../auth/auth.middleware.js';
import { Product } from './products.model.js';

const router = Router();

const productFields = {
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase()),
  description: z.string().trim().max(500).optional(),
  price: z.number().finite().min(0),
  stock: z.number().finite().min(0)
};

const createProductSchema = z.object(productFields).strict();
const updateProductSchema = z.object({
  ...productFields,
  isActive: z.boolean().optional()
}).partial().strict();
const publicProductFields = 'name sku description price stock isActive createdAt updatedAt';

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

    const product = await Product.create({ ...input, tenantId });
    response.status(201).json({
      data: await Product.findById(product.id).select(publicProductFields).lean()
    });
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

    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      { $set: input },
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
