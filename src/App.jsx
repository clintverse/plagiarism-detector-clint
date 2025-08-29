import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import FileUpload from './components/FileUpload.jsx';
import Results from './components/Results.jsx';

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUpload = (uploadedFiles) => {
    setFiles(uploadedFiles);
    setResults([]);
  };

  const analyzeFiles = () => {
    if (files.length < 2) return;
    
    setAnalyzing(true);
    
    setTimeout(() => {
      const newResults = [];
      
      for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const similarity = calculateSimilarity(files[i].content, files[j].content);
          newResults.push({
            id: `${i}-${j}`,
            file1: { name: files[i].name },
            file2: { name: files[j].name },
            similarity: similarity,
            confidence: Math.min(95, similarity + Math.random() * 10),
            matches: generateMatches(files[i].content, files[j].content),
            analysisType: 'Text Comparison'
          });
        }
      }
      
      setResults(newResults);
      setAnalyzing(false);
    }, 2000);
  };

  const calculateSimilarity = (text1, text2) => {
    // Clean and normalize text
    const cleanText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const clean1 = cleanText(text1);
    const clean2 = cleanText(text2);
    
    // Split into sentences and phrases
    const sentences1 = clean1.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentences2 = clean2.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Word-level comparison
    const words1 = clean1.split(/\s+/).filter(word => word.length > 3);
    const words2 = clean2.split(/\s+/).filter(word => word.length > 3);
    
    // Calculate word similarity
    const commonWords = words1.filter(word => words2.includes(word));
    const wordSimilarity = words1.length > 0 ? (commonWords.length / words1.length) * 100 : 0;
    
    // Calculate phrase similarity (3-word sequences)
    const getPhrases = (words) => {
      const phrases = [];
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
      return phrases;
    };
    
    const phrases1 = getPhrases(words1);
    const phrases2 = getPhrases(words2);
    const commonPhrases = phrases1.filter(phrase => phrases2.includes(phrase));
    const phraseSimilarity = phrases1.length > 0 ? (commonPhrases.length / phrases1.length) * 100 : 0;
    
    // Calculate sentence similarity
    let sentenceSimilarity = 0;
    if (sentences1.length > 0 && sentences2.length > 0) {
      let matchingSentences = 0;
      sentences1.forEach(sent1 => {
        sentences2.forEach(sent2 => {
          const sentWords1 = sent1.split(/\s+/);
          const sentWords2 = sent2.split(/\s+/);
          const commonInSent = sentWords1.filter(word => sentWords2.includes(word));
          if (commonInSent.length / Math.max(sentWords1.length, sentWords2.length) > 0.6) {
            matchingSentences++;
          }
        });
      });
      sentenceSimilarity = (matchingSentences / sentences1.length) * 100;
    }
    
    // Weighted final score
    const finalScore = (wordSimilarity * 0.4) + (phraseSimilarity * 0.4) + (sentenceSimilarity * 0.2);
    return Math.min(100, Math.round(finalScore));
  };

  const generateMatches = (text1, text2) => {
    const cleanText = (text) => text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const clean1 = cleanText(text1);
    const clean2 = cleanText(text2);
    
    const sentences1 = clean1.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const sentences2 = clean2.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    const matches = [];
    
    sentences1.forEach((sent1, i) => {
      sentences2.forEach((sent2, j) => {
        const words1 = sent1.split(/\s+/);
        const words2 = sent2.split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
        const similarity = (commonWords.length / Math.max(words1.length, words2.length)) * 100;
        
        if (similarity > 40) {
          matches.push({
            id: `${i}-${j}`,
            text1: text1.split(/[.!?]+/)[i]?.trim() || sent1.trim(),
            text2: text2.split(/[.!?]+/)[j]?.trim() || sent2.trim(),
            similarity: Math.round(similarity)
          });
        }
      });
    });
    
    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 6);
  };

  const clearFiles = () => {
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Plagiarism Detection System</h1>
              <p className="text-slate-600">Advanced document similarity analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FileUpload onUpload={handleUpload} files={files} />
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Analysis Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Files Uploaded:</span>
                  <span className="font-medium text-slate-900">{files.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ready to Analyze:</span>
                  <span className={`font-medium ${files.length >= 2 ? 'text-green-600' : 'text-red-600'}`}>
                    {files.length >= 2 ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Comparisons:</span>
                  <span className="font-medium text-slate-900">
                    {files.length >= 2 ? Math.floor((files.length * (files.length - 1)) / 2) : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={analyzeFiles}
                disabled={files.length < 2 || analyzing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Check Plagiarism</span>
                )}
              </button>
              
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  className="w-full bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-300 transition-colors duration-200"
                >
                  Clear All Files
                </button>
              )}
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-12">
            <Results results={results} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;