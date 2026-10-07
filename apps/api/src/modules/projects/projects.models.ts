import mongoose, { Model, Schema } from 'mongoose';

export interface ProjectDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'on_hold';
  startDate?: Date;
  dueDate?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const projectSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['planned', 'active', 'completed', 'on_hold'], default: 'planned', required: true },
  startDate: { type: Date },
  dueDate: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
projectSchema.index({ tenantId: 1, createdAt: -1 });

export const Project: Model<ProjectDocument> =
  mongoose.models.Project as Model<ProjectDocument> ?? mongoose.model<ProjectDocument>('Project', projectSchema);

export interface TaskDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  projectName: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dueDate?: Date;
  assignedEmployeeId?: mongoose.Types.ObjectId;
  assignedEmployeeName?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const taskSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, required: true, ref: 'Project' },
  projectName: { type: String, required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['todo', 'in_progress', 'blocked', 'done'], default: 'todo', required: true },
  dueDate: { type: Date },
  assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  assignedEmployeeName: { type: String, trim: true, maxlength: 120 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
taskSchema.index({ tenantId: 1, projectId: 1, createdAt: -1 });

export const Task: Model<TaskDocument> =
  mongoose.models.Task as Model<TaskDocument> ?? mongoose.model<TaskDocument>('Task', taskSchema);
