import mongoose, { Model, Schema } from 'mongoose';

export interface SequenceDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  kind: 'sale' | 'invoice';
  year: number;
  value: number;
}

const sequenceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    kind: { type: String, enum: ['sale', 'invoice'], required: true },
    year: { type: Number, required: true },
    value: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

sequenceSchema.index({ tenantId: 1, kind: 1, year: 1 }, { unique: true });

export const Sequence: Model<SequenceDocument> =
  mongoose.models.Sequence as Model<SequenceDocument> ?? mongoose.model<SequenceDocument>('Sequence', sequenceSchema);
