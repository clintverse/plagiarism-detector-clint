import { FileData, ComparisonResult, MatchSegment } from '../types';
import { calculateTfIdf, cosineSimilarity, jaccardSimilarity, ngramSimilarity, calculateLineSimilarity } from './textAnalysis';

export async function analyzeFiles(files: FileData[]): Promise<ComparisonResult[]> {
  const results: ComparisonResult[] = [];

  // Generate all possible pairs for comparison
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const file1 = files[i];
      const file2 = files[j];

      const result = await compareTexts(file1, file2);
      results.push(result);
    }
  }

  return results;
}

async function compareTexts(file1: FileData, file2: FileData): Promise<ComparisonResult> {
  // Check for identical content first
  const content1 = file1.content.trim();
  const content2 = file2.content.trim();
  
  if (content1 === content2) {
    return {
      id: `${file1.id}-${file2.id}`,
      file1,
      file2,
      similarity: 100.0,
      matches: [{
        file1Range: [0, 0],
        file2Range: [0, 0],
        content: content1.substring(0, 100) + (content1.length > 100 ? '...' : ''),
        similarity: 100,
        type: 'exact'
      }],
      analysisType: 'text',
      confidence: 95.0
    };
  }
  
  // Preprocess texts
  const text1 = preprocessText(file1.content);
  const text2 = preprocessText(file2.content);
  
  // Handle empty or very short texts
  if (text1.length < 5 || text2.length < 5) {
    return {
      id: `${file1.id}-${file2.id}`,
      file1,
      file2,
      similarity: 0.0,
      matches: [],
      analysisType: 'text',
      confidence: 20.0
    };
  }

  // Multiple similarity calculations for better accuracy
  const lineSimilarity = calculateLineSimilarity(file1.content, file2.content);
  const tfidfSimilarity = calculateTfIdfSimilarity(text1, text2);
  const jaccardSim = jaccardSimilarity(text1, text2);
  const ngramSim = ngramSimilarity(text1, text2, 2); // Use bigrams for better detection
  const sentenceSim = calculateSentenceSimilarity(file1.content, file2.content);

  // Weighted combination prioritizing line-by-line similarity for better accuracy
  let combinedSimilarity = (
    lineSimilarity * 0.4 +        // Highest weight for line similarity
    tfidfSimilarity * 0.25 +      // TF-IDF for semantic similarity
    jaccardSim * 0.15 +           // Jaccard for token overlap
    ngramSim * 0.15 +             // N-gram for phrase similarity
    sentenceSim * 0.05            // Sentence similarity as fine-tuning
  );
  
  // Ensure similarity is between 0 and 1
  combinedSimilarity = Math.min(1.0, Math.max(0, combinedSimilarity));

  // Find matching segments with improved detection
  const matches = findTextMatches(file1.content, file2.content);

  // Calculate confidence based on multiple factors
  const confidence = calculateConfidence(combinedSimilarity, matches, text1.length, text2.length);

  return {
    id: `${file1.id}-${file2.id}`,
    file1,
    file2,
    similarity: Math.round(combinedSimilarity * 10000) / 100, // Convert to percentage with 2 decimal places
    matches,
    analysisType: 'text',
    confidence: Math.round(confidence * 100) / 100
  };
}

function calculateTfIdfSimilarity(text1: string, text2: string): number {
  const documents = [text1, text2];
  const tfidfVectors = calculateTfIdf(documents);
  return cosineSimilarity(tfidfVectors[0], tfidfVectors[1]);
}

function calculateSentenceSimilarity(text1: string, text2: string): number {
  const sentences1 = splitIntoSentences(text1);
  const sentences2 = splitIntoSentences(text2);
  
  if (sentences1.length === 0 || sentences2.length === 0) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  sentences1.forEach(sent1 => {
    sentences2.forEach(sent2 => {
      if (sent1.length > 10 && sent2.length > 10) { // Lowered threshold for better detection
        const similarity = calculateStringSimilarity(sent1, sent2);
        totalSimilarity += similarity;
        comparisons++;
      }
    });
  });

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Lowered threshold for better detection
}

function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // Keep apostrophes and hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function findTextMatches(text1: string, text2: string): MatchSegment[] {
  const matches: MatchSegment[] = [];
  
  // Split by lines for better line-by-line comparison
  const lines1 = text1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const lines2 = text2.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  lines1.forEach((line1, i) => {
    lines2.forEach((line2, j) => {
      const similarity = calculateStringSimilarity(line1, line2);
      
      if (similarity > 0.7) { // Lowered threshold for better detection
        matches.push({
          file1Range: [i, i],
          file2Range: [j, j],
          content: line1.substring(0, 100) + (line1.length > 100 ? '...' : ''),
          similarity: similarity * 100,
          type: similarity > 0.95 ? 'exact' : similarity > 0.85 ? 'similar' : 'paraphrase'
        });
      }
    });
  });

  // Also check sentences for additional matches
  const sentences1 = splitIntoSentences(text1);
  const sentences2 = splitIntoSentences(text2);

  sentences1.forEach((sentence1, i) => {
    sentences2.forEach((sentence2, j) => {
      const similarity = calculateStringSimilarity(sentence1.trim(), sentence2.trim());
      
      if (similarity > 0.7) {
        // Avoid duplicate matches
        const isDuplicate = matches.some(match => 
          Math.abs(match.similarity - similarity * 100) < 5 &&
          match.content.substring(0, 50) === sentence1.trim().substring(0, 50)
        );
        
        if (!isDuplicate) {
          matches.push({
            file1Range: [i, i],
            file2Range: [j, j],
            content: sentence1.trim().substring(0, 100) + (sentence1.length > 100 ? '...' : ''),
            similarity: similarity * 100,
            type: similarity > 0.95 ? 'exact' : similarity > 0.85 ? 'similar' : 'paraphrase'
          });
        }
      }
    });
  });

  // Sort by similarity and return top matches
  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Handle identical strings
  if (str1 === str2) return 1.0;
  
  // Normalize strings
  const norm1 = str1.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  const norm2 = str2.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0;

  // Enhanced word-based similarity with higher accuracy
  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Calculate word overlap more accurately
  const commonWords = words1.filter(word => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);
  const wordSimilarity = commonWords / totalWords;
  
  // Use Levenshtein distance for character-level similarity
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  const charSimilarity = (longer.length - editDistance) / longer.length;
  
  // Combine similarities with emphasis on word-level matching
  const finalSimilarity = (wordSimilarity * 0.8) + (charSimilarity * 0.2);
  
  return Math.min(1.0, Math.max(0, finalSimilarity));
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateConfidence(similarity: number, matches: MatchSegment[], text1Length: number, text2Length: number): number {
  const baseSimilarity = similarity;
  
  // Factor in number of matches
  const matchFactor = Math.min(matches.length / 8, 1) * 0.15;
  
  // Factor in text length similarity (more confidence if texts are similar length)
  const lengthRatio = Math.min(text1Length, text2Length) / Math.max(text1Length, text2Length);
  const lengthFactor = lengthRatio * 0.1;
  
  // Factor in quality of matches
  const avgMatchQuality = matches.length > 0 
    ? matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length / 100
    : 0;
  const qualityFactor = avgMatchQuality * 0.1;
  
  const confidence = (baseSimilarity + matchFactor + lengthFactor + qualityFactor) * 100;
  
  return Math.min(95, Math.max(20, confidence));
}