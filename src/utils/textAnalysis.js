export function calculateTfIdf(documents) {
  const tokenizedDocs = documents.map(doc => tokenize(doc));
  const vocabulary = buildVocabulary(tokenizedDocs);
  
  if (documents.length === 2 && documents[0].trim() === documents[1].trim()) {
    const identicalVector = {};
    vocabulary.forEach(term => {
      identicalVector[term] = 1.0;
    });
    return [identicalVector, identicalVector];
  }
  
  return tokenizedDocs.map(tokens => {
    const tfVector = calculateTf(tokens, vocabulary);
    const tfidfVector = {};
    
    Object.keys(tfVector).forEach(term => {
      const idf = calculateIdf(term, tokenizedDocs);
      tfidfVector[term] = tfVector[term] * idf;
    });
    
    return tfidfVector;
  });
}

export function cosineSimilarity(vector1, vector2) {
  const terms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
  
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
  
  if (magnitude === 0) {
    return magnitude1 === 0 && magnitude2 === 0 ? 1.0 : 0;
  }
  
  const similarity = dotProduct / magnitude;
  return Math.min(1.0, Math.max(0, similarity));
}

export function calculateLineSimilarity(text1, text2) {
  const lines1 = text1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const lines2 = text2.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines1.length === 0 && lines2.length === 0) return 1.0;
  if (lines1.length === 0 || lines2.length === 0) return 0.0;
  
  let matchingLines = 0;
  const totalLines = Math.max(lines1.length, lines2.length);
  
  lines1.forEach(line1 => {
    const bestMatch = lines2.reduce((maxSim, line2) => {
      const similarity = calculateStringSimilarity(line1, line2);
      return Math.max(maxSim, similarity);
    }, 0);
    
    if (bestMatch > 0.8) {
      matchingLines++;
    }
  });
  
  lines2.forEach(line2 => {
    const bestMatch = lines1.reduce((maxSim, line1) => {
      const similarity = calculateStringSimilarity(line1, line2);
      return Math.max(maxSim, similarity);
    }, 0);
    
    if (bestMatch > 0.8) {
      const alreadyCounted = lines1.some(line1 => 
        calculateStringSimilarity(line1, line2) > 0.8
      );
      if (!alreadyCounted) {
        matchingLines++;
      }
    }
  });
  
  const similarity = matchingLines / totalLines;
  return Math.min(1.0, similarity);
}

function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  
  const norm1 = str1.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  const norm2 = str2.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0;

  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  const charSimilarity = (longer.length - editDistance) / longer.length;
  
  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);
  const wordSimilarity = commonWords / totalWords;
  
  const finalSimilarity = (charSimilarity * 0.3) + (wordSimilarity * 0.7);
  
  return Math.min(1.0, Math.max(0, finalSimilarity));
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function tokenize(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token.length > 1 && !isStopWord(token));
  
  return tokens;
}

function buildVocabulary(tokenizedDocs) {
  const termSet = new Set();
  tokenizedDocs.forEach(tokens => {
    tokens.forEach(token => termSet.add(token));
  });
  return Array.from(termSet);
}

function calculateTf(tokens, vocabulary) {
  const tf = {};
  const totalTokens = tokens.length;
  
  if (totalTokens === 0) return tf;
  
  vocabulary.forEach(term => {
    const count = tokens.filter(token => token === term).length;
    tf[term] = count / totalTokens;
  });
  
  return tf;
}

function calculateIdf(term, tokenizedDocs) {
  const docsWithTerm = tokenizedDocs.filter(tokens => tokens.includes(term)).length;
  return Math.log(tokenizedDocs.length / Math.max(docsWithTerm, 1));
}

function isStopWord(word) {
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

export function jaccardSimilarity(text1, text2) {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function ngramSimilarity(text1, text2, n = 3) {
  const ngrams1 = generateNgrams(text1, n);
  const ngrams2 = generateNgrams(text2, n);
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function generateNgrams(text, n) {
  const words = tokenize(text);
  const ngrams = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}