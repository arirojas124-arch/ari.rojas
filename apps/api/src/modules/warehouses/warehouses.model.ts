import mongoose, { Model, Schema } from 'mongoose';

export interface WarehouseDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  isDefault: boolean;
}

const warehouseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    address: { type: String, trim: true, maxlength: 240 },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

warehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ tenantId: 1, createdAt: -1 });

export const Warehouse: Model<WarehouseDocument> =
  mongoose.models.Warehouse as Model<WarehouseDocument> ?? mongoose.model<WarehouseDocument>('Warehouse', warehouseSchema);
