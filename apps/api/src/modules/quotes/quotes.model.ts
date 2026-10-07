import mongoose, { Model, Schema } from 'mongoose';

export type QuoteItem = {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export interface QuoteDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  quoteNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: QuoteItem[];
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const quoteItemSchema = new Schema<QuoteItem>(
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

const quoteSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    quoteNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },
    customerName: { type: String, required: true },
    items: { type: [quoteItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected'], default: 'draft', required: true },
    validUntil: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

quoteSchema.index({ tenantId: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ tenantId: 1, createdAt: -1 });

export const Quote: Model<QuoteDocument> =
  mongoose.models.Quote as Model<QuoteDocument> ?? mongoose.model<QuoteDocument>('Quote', quoteSchema);
