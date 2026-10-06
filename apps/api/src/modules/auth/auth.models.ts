import mongoose, { Model, Schema } from 'mongoose';

export interface CompanyDocument extends mongoose.Document {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface UserDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}

export interface RefreshSessionDocument extends mongoose.Document {
  tokenId: string;
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: { type: String, trim: true, maxlength: 240 },
    phone: { type: String, trim: true, maxlength: 40 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, default: 'employee' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const refreshSessionSchema = new Schema(
  {
    tokenId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Company: Model<CompanyDocument> = mongoose.models.Company as Model<CompanyDocument> ?? mongoose.model<CompanyDocument>('Company', companySchema);
export const User: Model<UserDocument> = mongoose.models.User as Model<UserDocument> ?? mongoose.model<UserDocument>('User', userSchema);
export const RefreshSession: Model<RefreshSessionDocument> =
  mongoose.models.RefreshSession as Model<RefreshSessionDocument> ?? mongoose.model<RefreshSessionDocument>('RefreshSession', refreshSessionSchema);