export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface ScoredChunk {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorStore {
  addDocument(doc: Document): Promise<void>;
  search(query: string, filters?: any): Promise<ScoredChunk[]>;
}


