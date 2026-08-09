import mongoose, { Schema, Document } from 'mongoose';
import { pipeline } from '@xenova/transformers';

export interface ICampusDocument extends Document {
  content: string;
  source: string;
  embedding: number[];
}

const CampusDocSchema = new Schema<ICampusDocument>({
  content: { type: String, required: true },
  source: { type: String, required: true },
  embedding: { type: [Number], required: true }, // Standard array, no special index needed!
});

export const CampusDoc = mongoose.model<ICampusDocument>('CampusDoc', CampusDocSchema);

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Perform Vector Search entirely in-memory
export async function searchCampusDocs(userQuery: string, topK: number = 3) {
  // 1. Generate query embedding using a free local model (no API key needed!)
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(userQuery, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data) as number[];

  // 2. Fetch all document vectors from standard free MongoDB M0 cluster
  const docs = await CampusDoc.find({}, 'content source embedding').lean();

  // 3. Compute similarity and rank top matches
  const rankedDocs = docs
    .map((doc) => ({
      content: doc.content,
      source: doc.source,
      score: cosineSimilarity(queryVector, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return rankedDocs;
}
