export interface FileData {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface ComparisonResult {
  id: string;
  file1: FileData;
  file2: FileData;
  similarity: number;
  matches: MatchSegment[];
  analysisType: 'text' | 'code';
  confidence: number;
}

export interface MatchSegment {
  file1Range: [number, number];
  file2Range: [number, number];
  content: string;
  similarity: number;
  type: 'exact' | 'similar' | 'paraphrase';
}

export interface SimilarityThreshold {
  low: number;
  medium: number;
  high: number;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  stage: string;
}