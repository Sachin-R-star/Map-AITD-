import { Schema, model, Document } from 'mongoose';

export interface IEdge {
  targetNodeId: string;
  distance: number;      // weight (e.g. Euclidean distance or custom weight)
  grade?: number;        // slope/steepness (important for wheelchair accessibility)
  stepFree: boolean;     // accessibility flag
}

export interface IPathNode extends Document {
  nodeId: string;
  displayName?: string;
  coordinates: [number, number]; // [longitude, latitude]
  edges: IEdge[];
}

const EdgeSchema = new Schema<IEdge>({
  targetNodeId: { type: String, required: true },
  distance: { type: Number, required: true },
  grade: { type: Number },
  stepFree: { type: Boolean, default: true }
});

const PathNodeSchema = new Schema<IPathNode>({
  nodeId: { type: String, required: true, unique: true },
  displayName: { type: String },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  edges: [EdgeSchema]
});

// We can also index coordinates for fast geographic lookups
PathNodeSchema.index({ coordinates: '2d' });

export const PathNode = model<IPathNode>('PathNode', PathNodeSchema);
