import mongoose, { Model, Schema } from 'mongoose';

export type PurchaseRequestLine = {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
};

const requestLineSchema = new Schema<PurchaseRequestLine>({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

export interface PurchaseRequestDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  requestNumber: string;
  requestedBy: mongoose.Types.ObjectId;
  reason: string;
  items: PurchaseRequestLine[];
  status: 'draft' | 'approved' | 'rejected';
}

const purchaseRequestSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  requestNumber: { type: String, required: true },
  requestedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  items: { type: [requestLineSchema], required: true },
  status: { type: String, enum: ['draft', 'approved', 'rejected'], default: 'draft', required: true }
}, { timestamps: true });
purchaseRequestSchema.index({ tenantId: 1, requestNumber: 1 }, { unique: true });
purchaseRequestSchema.index({ tenantId: 1, createdAt: -1 });

export const PurchaseRequest: Model<PurchaseRequestDocument> =
  mongoose.models.PurchaseRequest as Model<PurchaseRequestDocument> ?? mongoose.model<PurchaseRequestDocument>('PurchaseRequest', purchaseRequestSchema);

export type PurchaseOrderLine = PurchaseRequestLine & {
  unitCost: number;
  receivedQuantity: number;
};

const purchaseOrderLineSchema = new Schema<PurchaseOrderLine>({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

export interface PurchaseOrderDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  warehouseId: mongoose.Types.ObjectId;
  items: PurchaseOrderLine[];
  total: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  status: 'open' | 'partially_received' | 'received' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
}

const purchaseOrderSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  orderNumber: { type: String, required: true },
  supplierId: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier' },
  supplierName: { type: String, required: true },
  warehouseId: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  items: { type: [purchaseOrderLineSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', required: true },
  paidAmount: { type: Number, min: 0, default: 0, required: true },
  status: { type: String, enum: ['open', 'partially_received', 'received', 'cancelled'], default: 'open', required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
purchaseOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ tenantId: 1, createdAt: -1 });

export const PurchaseOrder: Model<PurchaseOrderDocument> =
  mongoose.models.PurchaseOrder as Model<PurchaseOrderDocument> ?? mongoose.model<PurchaseOrderDocument>('PurchaseOrder', purchaseOrderSchema);

export interface ReceiptDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  receiptNumber: string;
  purchaseOrderId: mongoose.Types.ObjectId;
  orderNumber: string;
  warehouseId: mongoose.Types.ObjectId;
  items: Array<{ productId: mongoose.Types.ObjectId; sku: string; name: string; quantity: number }>;
  receivedBy: mongoose.Types.ObjectId;
}

const receiptLineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const receiptSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  receiptNumber: { type: String, required: true },
  purchaseOrderId: { type: Schema.Types.ObjectId, required: true, ref: 'PurchaseOrder' },
  orderNumber: { type: String, required: true },
  warehouseId: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  items: { type: [receiptLineSchema], required: true },
  receivedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
receiptSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });
receiptSchema.index({ tenantId: 1, createdAt: -1 });

export const Receipt: Model<ReceiptDocument> =
  mongoose.models.Receipt as Model<ReceiptDocument> ?? mongoose.model<ReceiptDocument>('Receipt', receiptSchema);
