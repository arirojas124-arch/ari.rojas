import mongoose, { Model, Schema } from 'mongoose';

export interface FinanceTransactionDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  kind: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  occurredAt: Date;
  reference?: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const financeTransactionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    kind: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    amount: { type: Number, required: true, min: 0.01 },
    occurredAt: { type: Date, required: true },
    reference: { type: String, trim: true, maxlength: 100 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
financeTransactionSchema.index({ tenantId:  1, occurredAt: -1 });

export const FinanceTransaction: Model<FinanceTransactionDocument> =
  mongoose.models.FinanceTransaction as Model<FinanceTransactionDocument> ?? mongoose.model<FinanceTransactionDocument>('FinanceTransaction', financeTransactionSchema);
