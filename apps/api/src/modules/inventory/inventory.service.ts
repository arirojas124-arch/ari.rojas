import mongoose from 'mongoose';
import { Product } from '../products/products.model.js';
import { InventoryLevel } from './inventory.models.js';
import { Warehouse } from '../warehouses/warehouses.model.js';

export async function ensureDefaultWarehouse(tenantId: mongoose.Types.ObjectId) {
  const warehouse = await Warehouse.findOneAndUpdate(
    { tenantId, code: 'MAIN' },
    { $setOnInsert: { tenantId, code: 'MAIN', name: 'Almacén principal', isDefault: true, isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return warehouse;
}

export async function ensureLegacyInventory(tenantId: mongoose.Types.ObjectId) {
  const warehouse = await ensureDefaultWarehouse(tenantId);
  const products = await Product.find({ tenantId, inventoryInitialized: { $ne: true } });
  for (const product of products) {
    await InventoryLevel.updateOne(
      { tenantId, warehouseId: warehouse._id, productId: product._id },
      { $setOnInsert: { tenantId, warehouseId: warehouse._id, productId: product._id, quantity: product.stock } },
      { upsert: true }
    );
    await Product.updateOne(
      { _id: product._id, tenantId, inventoryInitialized: { $ne: true } },
      { $set: { inventoryInitialized: true } }
    );
  }

  const [activeWarehouses, tenantProducts] = await Promise.all([
    Warehouse.find({ tenantId, isActive: true }).select('_id').lean(),
    Product.find({ tenantId }).select('_id').lean()
  ]);
  if (activeWarehouses.length && tenantProducts.length) {
    await InventoryLevel.bulkWrite(activeWarehouses.flatMap((activeWarehouse) => tenantProducts.map((product) => ({
      updateOne: {
        filter: { tenantId, warehouseId: activeWarehouse._id, productId: product._id },
        update: { $setOnInsert: { tenantId, warehouseId: activeWarehouse._id, productId: product._id, quantity: 0 } },
        upsert: true
      }
    }))));
  }
  return warehouse;
}
