interface TfIdfVector {
  [term: string]: number;
}

export function calculateTfIdf(documents: string[]): TfIdfVector[] {
  const tokenizedDocs = documents.map(doc => tokenize(doc));
  const vocabulary = buildVocabulary(tokenizedDocs);
  
  // Handle edge case where documents are identical or very similar
  if (documents.length === 2 && documents[0].trim() === documents[1].trim()) {
    // Return identical vectors for identical documents
    const identicalVector: TfIdfVector = {};
    vocabulary.forEach(term => {
      identicalVector[term] = 1.0;
    });
    return [identicalVector, identicalVector];
  }
  
  return tokenizedDocs.map(tokens => {
    const tfVector = calculateTf(tokens, vocabulary);
    const tfidfVector: TfIdfVector = {};
    
    Object.keys(tfVector).forEach(term => {
      const idf = calculateIdf(term, tokenizedDocs);
      tfidfVector[term] = tfVector[term] * idf;
    });
    
    return tfidfVector;
  });
}

export function cosineSimilarity(vector1: TfIdfVector, vector2: TfIdfVector): number {
  const terms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
  
  // Handle identical vectors
  if (terms.size === 0) return 1.0;
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  terms.forEach(term => {
    const val1 = vector1[term] || 0;
    const val2 = vector2[term] || 0;
    
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });
  
  const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  
  // Handle edge cases
  if (magnitude === 0) {
    // If both vectors are zero, they are identical
    return magnitude1 === 0 && magnitude2 === 0 ? 1.0 : 0;
  }
  
  const similarity = dotProduct / magnitude;
  return Math.min(1.0, Math.max(0, similarity)); // Clamp between 0 and 1
}

// Line-by-line similarity calculation for better accuracy
export function calculateLineSimilarity(text1: string, text2: string): number {
  const lines1 = text1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const lines2 = text2.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines1.length === 0 && lines2.length === 0) return 1.0;
  if (lines1.length === 0 || lines2.length === 0) return 0.0;
  
  let matchingLines = 0;
  const totalLines = Math.max(lines1.length, lines2.length);
  
  // Check each line in text1 against all lines in text2
  lines1.forEach(line1 => {
    const bestMatch = lines2.reduce((maxSim, line2) => {
      const similarity = calculateStringSimilarity(line1, line2);
      return Math.max(maxSim, similarity);
    }, 0);
    
    // Consider it a match if similarity is above 0.8
    if (bestMatch > 0.8) {
      matchingLines++;
    }
  });
  
  // Also check lines2 against lines1 to catch any missed matches
  lines2.forEach(line2 => {
    const bestMatch = lines1.reduce((maxSim, line1) => {
      const similarity = calculateStringSimilarity(line1, line2);
      return Math.max(maxSim, similarity);
    }, 0);
    
    // Only count if we haven't already counted this as a match
    if (bestMatch > 0.8) {
      const alreadyCounted = lines1.some(line1 => 
        calculateStringSimilarity(line1, line2) > 0.8
      );
      if (!alreadyCounted) {
        matchingLines++;
      }
    }
  });
  
  // Calculate similarity as ratio of matching lines to total lines
  const similarity = matchingLines / totalLines;
  return Math.min(1.0, similarity);
}

// Enhanced string similarity calculation
function calculateStringSimilarity(str1: string, str2: string): number {
  // Handle identical strings
  if (str1 === str2) return 1.0;
  
  // Normalize strings
  const norm1 = str1.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  const norm2 = str2.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0;

  // Use Levenshtein distance for character-level similarity
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  const charSimilarity = (longer.length - editDistance) / longer.length;
  
  // Enhanced word-based similarity
  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);
  const wordSimilarity = commonWords / totalWords;
  
  // Combine character and word similarities with higher weight on word similarity
  const finalSimilarity = (charSimilarity * 0.3) + (wordSimilarity * 0.7);
  
  return Math.min(1.0, Math.max(0, finalSimilarity));
}

// Levenshtein distance calculation
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

// Enhanced tokenization with better preprocessing
function tokenize(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ') // Keep apostrophes and hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(' ')
    .filter(token => token.length > 1 && !isStopWord(token)); // Reduced minimum length
  
  return tokens;
}

function buildVocabulary(tokenizedDocs: string[][]): string[] {
  const termSet = new Set<string>();
  tokenizedDocs.forEach(tokens => {
    tokens.forEach(token => termSet.add(token));
  });
  return Array.from(termSet);
}

function calculateTf(tokens: string[], vocabulary: string[]): { [term: string]: number } {
  const tf: { [term: string]: number } = {};
  const totalTokens = tokens.length;
  
  if (totalTokens === 0) return tf;
  
  vocabulary.forEach(term => {
    const count = tokens.filter(token => token === term).length;
    tf[term] = count / totalTokens;
  });
  
  return tf;
}

function calculateIdf(term: string, tokenizedDocs: string[][]): number {
  const docsWithTerm = tokenizedDocs.filter(tokens => tokens.includes(term)).length;
  return Math.log(tokenizedDocs.length / Math.max(docsWithTerm, 1));
}

// Comprehensive stop words list
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'now', 'then', 'also', 'well', 'get', 'go', 'come', 'see', 'know', 'think', 'take',
    'make', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave'
  ]);
  
  return stopWords.has(word);
}

// Additional similarity calculation using Jaccard similarity for cross-validation
export function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// N-gram similarity for better phrase matching
export function ngramSimilarity(text1: string, text2: string, n: number = 3): number {
  const ngrams1 = generateNgrams(text1, n);
  const ngrams2 = generateNgrams(text2, n);
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function generateNgrams(text: string, n: number): string[] {
  const words = tokenize(text);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}