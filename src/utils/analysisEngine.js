import { calculateTfIdf, cosineSimilarity, jaccardSimilarity, ngramSimilarity, calculateLineSimilarity } from './textAnalysis.js';

export async function analyzeFiles(files) {
  const results = [];

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

async function compareTexts(file1, file2) {
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
  
  const text1 = preprocessText(file1.content);
  const text2 = preprocessText(file2.content);
  
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

  const lineSimilarity = calculateLineSimilarity(file1.content, file2.content);
  const tfidfSimilarity = calculateTfIdfSimilarity(text1, text2);
  const jaccardSim = jaccardSimilarity(text1, text2);
  const ngramSim = ngramSimilarity(text1, text2, 2);
  const sentenceSim = calculateSentenceSimilarity(file1.content, file2.content);

  let combinedSimilarity = (
    lineSimilarity * 0.4 +
    tfidfSimilarity * 0.25 +
    jaccardSim * 0.15 +
    ngramSim * 0.15 +
    sentenceSim * 0.05
  );
  
  combinedSimilarity = Math.min(1.0, Math.max(0, combinedSimilarity));

  const matches = findTextMatches(file1.content, file2.content);

  const confidence = calculateConfidence(combinedSimilarity, matches, text1.length, text2.length);

  return {
    id: `${file1.id}-${file2.id}`,
    file1,
    file2,
    similarity: Math.round(combinedSimilarity * 10000) / 100,
    matches,
    analysisType: 'text',
    confidence: Math.round(confidence * 100) / 100
  };
}

function calculateTfIdfSimilarity(text1, text2) {
  const documents = [text1, text2];
  const tfidfVectors = calculateTfIdf(documents);
  return cosineSimilarity(tfidfVectors[0], tfidfVectors[1]);
}

function calculateSentenceSimilarity(text1, text2) {
  const sentences1 = splitIntoSentences(text1);
  const sentences2 = splitIntoSentences(text2);
  
  if (sentences1.length === 0 || sentences2.length === 0) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  sentences1.forEach(sent1 => {
    sentences2.forEach(sent2 => {
      if (sent1.length > 10 && sent2.length > 10) {
        const similarity = calculateStringSimilarity(sent1, sent2);
        totalSimilarity += similarity;
        comparisons++;
      }
    });
  });

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

function splitIntoSentences(text) {
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findTextMatches(text1, text2) {
  const matches = [];
  
  const lines1 = text1.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const lines2 = text2.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  lines1.forEach((line1, i) => {
    lines2.forEach((line2, j) => {
      const similarity = calculateStringSimilarity(line1, line2);
      
      if (similarity > 0.7) {
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

  const sentences1 = splitIntoSentences(text1);
  const sentences2 = splitIntoSentences(text2);

  sentences1.forEach((sentence1, i) => {
    sentences2.forEach((sentence2, j) => {
      const similarity = calculateStringSimilarity(sentence1.trim(), sentence2.trim());
      
      if (similarity > 0.7) {
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

  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);
}

function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  
  const norm1 = str1.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  const norm2 = str2.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0;

  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);
  const wordSimilarity = commonWords / totalWords;
  
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  const charSimilarity = (longer.length - editDistance) / longer.length;
  
  const finalSimilarity = (wordSimilarity * 0.8) + (charSimilarity * 0.2);
  
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

function calculateConfidence(similarity, matches, text1Length, text2Length) {
  const baseSimilarity = similarity;
  
  const matchFactor = Math.min(matches.length / 8, 1) * 0.15;
  
  const lengthRatio = Math.min(text1Length, text2Length) / Math.max(text1Length, text2Length);
  const lengthFactor = lengthRatio * 0.1;
  
  const avgMatchQuality = matches.length > 0 
    ? matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length / 100
    : 0;
  const qualityFactor = avgMatchQuality * 0.1;
  
  const confidence = (baseSimilarity + matchFactor + lengthFactor + qualityFactor) * 100;
  
  return Math.min(95, Math.max(20, confidence));
}