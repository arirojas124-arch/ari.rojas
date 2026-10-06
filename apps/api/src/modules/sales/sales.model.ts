import mongoose, { Model, Schema } from 'mongoose';

export type SaleItemSnapshot = {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export interface SaleDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: SaleItemSnapshot[];
  total: number;
  createdBy: mongoose.Types.ObjectId;
}

const saleItemSchema = new Schema<SaleItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    saleNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },
    customerName: { type: String, required: true },
    items: { type: [saleItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

saleSchema.index({ tenantId: 1, saleNumber: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, createdAt: -1 });
saleSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

export const Sale: Model<SaleDocument> =
  mongoose.models.Sale as Model<SaleDocument> ?? mongoose.model<SaleDocument>('Sale', saleSchema);
