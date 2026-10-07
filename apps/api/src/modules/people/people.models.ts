import mongoose, { Model, Schema } from 'mongoose';

export interface DepartmentDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
}

const departmentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 300 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Department: Model<DepartmentDocument> =
  mongoose.models.Department as Model<DepartmentDocument> ?? mongoose.model<DepartmentDocument>('Department', departmentSchema);

export interface EmployeeDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  employeeNumber: string;
  name: string;
  email?: string;
  phone?: string;
  departmentId?: mongoose.Types.ObjectId;
  departmentName?: string;
  jobTitle?: string;
  startDate?: Date;
  isActive: boolean;
}

const employeeSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  employeeNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String, trim: true, maxlength: 100 },
  jobTitle: { type: String, trim: true, maxlength: 100 },
  startDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
employeeSchema.index({ tenantId: 1, employeeNumber: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, createdAt: -1 });

export const Employee: Model<EmployeeDocument> =
  mongoose.models.Employee as Model<EmployeeDocument> ?? mongoose.model<EmployeeDocument>('Employee', employeeSchema);

export interface AttendanceDocument extends mongoose.Document {
  tenantId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  workDate: Date;
  status: 'present' | 'absent' | 'leave';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
}

const attendanceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  employeeId: { type: Schema.Types.ObjectId, required: true, ref: 'Employee' },
  employeeName: { type: String, required: true },
  workDate: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
  notes: { type: String, trim: true, maxlength: 300 },
  recordedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });
attendanceSchema.index({ tenantId: 1, employeeId: 1, workDate: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, workDate: -1 });

export const Attendance: Model<AttendanceDocument> =
  mongoose.models.Attendance as Model<AttendanceDocument> ?? mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);
