import mongoose, { Model, Schema } from 'mongoose';

export interface CustomerDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

const customerSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    address: { type: String, trim: true, maxlength: 240 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, createdAt: -1 });

export const Customer: Model<CustomerDocument> =
  mongoose.models.Customer as Model<CustomerDocument> ?? mongoose.model<CustomerDocument>('Customer', customerSchema);
