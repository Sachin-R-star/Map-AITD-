import { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  displayName: string;
  hod?: string;
  email?: string;
  phone?: string;
  officeLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  accessibilityFeatures?: string[];
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  hod: { type: String },
  email: { type: String },
  phone: { type: String },
  officeLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number]
    }
  },
  accessibilityFeatures: [{ type: String }]
});

export const Department = model<IDepartment>('Department', DepartmentSchema);
