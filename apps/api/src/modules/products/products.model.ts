import mongoose, { Model, Schema } from 'mongoose';

export interface ProductDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
}

const productSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 64 },
    description: { type: String, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, createdAt: -1 });

export const Product: Model<ProductDocument> =
  mongoose.models.Product as Model<ProductDocument> ?? mongoose.model<ProductDocument>('Product', productSchema);
