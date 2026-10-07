import mongoose, { Model, Schema } from 'mongoose';

export interface SupplierDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

const supplierSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    address: { type: String, trim: true, maxlength: 240 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, createdAt: -1 });

export const Supplier: Model<SupplierDocument> =
  mongoose.models.Supplier as Model<SupplierDocument> ?? mongoose.model<SupplierDocument>('Supplier', supplierSchema);
