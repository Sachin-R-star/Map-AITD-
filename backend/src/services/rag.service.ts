import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

// Helper to check if a section contains a query word on word boundaries
function containsWord(text: string, word: string): boolean {
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(
    '(?:^|[^a-zA-Z0-9\\u0900-\\u097F])' +
      escapedWord +
      '(?:$|[^a-zA-Z0-9\\u0900-\\u097F])',
    'i'
  );
  return regex.test(text);
}

export class RagService {
  private static genAI: GoogleGenAI | null = null;

  static initialize(): void {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  static getGenAI(): GoogleGenAI | null {
    if (!this.genAI) {
      this.initialize();
    }
    return this.genAI;
  }

  /**
   * Search local text documents for matching context
   */
  static searchLocalKnowledge(query: string): string {
    try {
      const dataDir = path.resolve(__dirname, '../../../data');
      if (!fs.existsSync(dataDir)) {
        return '';
      }

      const files = fs.readdirSync(dataDir);
      let allContent = '';

      for (const file of files) {
        if (file.endsWith('.txt')) {
          const filePath = path.join(dataDir, file);
          allContent += fs.readFileSync(filePath, 'utf8') + '\n\n';
        }
      }

      if (!allContent) return '';

      // Split content by sections or paragraphs
      const sections = allContent.split(/===|(?:\r?\n){2,}/);
      const matchingSections: Array<{ section: string; score: number }> = [];

      // Define stop words to ignore in query keyword scoring
      const stopWords = [
        'hai', 'hain', 'he', 'ho', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein',
        'bhai', 'batao', 'suno', 'naam', 'pata', 'bata', 'kar', 'kr', 'kra',
        'kiya', 'tha', 'thi', 'the', 'kya', 'kise', 'kisne', 'kon', 'kaun',
        'ab', 'gaya', 'gaye', 'gayi', 'aur', 'ya', 'toh', 'to', 'hi'
      ];
      const words = query
        .toLowerCase()
        .split(/[\s,.\?\!]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

      for (const section of sections) {
        const cleanSection = section.trim();
        if (!cleanSection) continue;

        const lowerSection = cleanSection.toLowerCase();
        let score = 0;

        for (const word of words) {
          if (containsWord(lowerSection, word)) {
            score += 1;
            const firstLine = lowerSection.split('\n')[0];
            if (containsWord(firstLine, word)) {
              score += 2;
            }
          }
        }

        if (score > 0) {
          matchingSections.push({ section: cleanSection, score });
        }
      }

      // Sort by relevance score descending
      matchingSections.sort((a, b) => b.score - a.score);

      // Take top 3 matches
      const topMatches = matchingSections.slice(0, 3).map(m => m.section);
      return topMatches.join('\n\n---\n\n');
    } catch (error) {
      console.error('RAG keyword search failed:', error);
      return '';
    }
  }

  /**
   * Stub implementation for Vector Search in MongoDB
   * In a live MongoDB Atlas Vector Search cluster, this translates the query to embeddings
   * and runs an `$vectorSearch` pipeline.
   */
  static async searchVectorKnowledge(query: string): Promise<string> {
    // Vector search fallback to keyword search for offline/local resilience
    return this.searchLocalKnowledge(query);
  }
}
export default RagService;
