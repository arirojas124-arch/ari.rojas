import mongoose, { Model, Schema } from 'mongoose';

export interface InventoryLevelDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

const inventoryLevelSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true, min: 0, default: 0 }
  },
  { timestamps: true }
);
inventoryLevelSchema.index({ tenantId: 1, warehouseId: 1, productId: 1 }, { unique: true });

export const InventoryLevel: Model<InventoryLevelDocument> =
  mongoose.models.InventoryLevel as Model<InventoryLevelDocument> ?? mongoose.model<InventoryLevelDocument>('InventoryLevel', inventoryLevelSchema);

export interface InventoryMovementDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantityChange: number;
  reason: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantityChange: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 240 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);
inventoryMovementSchema.index({ tenantId: 1, createdAt: -1 });

export const InventoryMovement: Model<InventoryMovementDocument> =
  mongoose.models.InventoryMovement as Model<InventoryMovementDocument> ?? mongoose.model<InventoryMovementDocument>('InventoryMovement', inventoryMovementSchema);
