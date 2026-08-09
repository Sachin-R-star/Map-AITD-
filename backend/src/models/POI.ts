import { Schema, model, Document } from 'mongoose';

export interface IPOI extends Document {
  name: string;
  displayName: string;
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  description?: string;
  accessible: boolean;
}

const POISchema = new Schema<IPOI>({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  description: { type: String },
  accessible: { type: Boolean, default: true }
});

// Create 2dsphere spatial index on location field
POISchema.index({ location: '2dsphere' });

export const POI = model<IPOI>('POI', POISchema);
