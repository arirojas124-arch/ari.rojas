import mongoose, { Model, Schema } from 'mongoose';

export interface InvoiceDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  saleId: mongoose.Types.ObjectId;
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  total: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
}

const invoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    saleId: { type: Schema.Types.ObjectId, required: true, ref: 'Sale' },
    saleNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },
    customerName: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending', required: true },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, saleId: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice as Model<InvoiceDocument> ?? mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
