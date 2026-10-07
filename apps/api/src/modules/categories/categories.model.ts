import mongoose, { Model, Schema } from 'mongoose';

export interface CategoryDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
}

const categorySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Category: Model<CategoryDocument> =
  mongoose.models.Category as Model<CategoryDocument> ?? mongoose.model<CategoryDocument>('Category', categorySchema);
