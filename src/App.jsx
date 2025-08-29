import React, { useState } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
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
            file1: files[i].name,
            file2: files[j].name,
            similarity: similarity
          });
        }
      }
      
      setResults(newResults);
      setAnalyzing(false);
    }, 1500);
  };

  const calculateSimilarity = (text1, text2) => {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return Math.round((commonWords.length / totalWords) * 100);
  };

  const clearFiles = () => {
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plagiarism Checker</h1>
              <p className="text-gray-600">Compare documents for similarity</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FileUpload onUpload={handleUpload} />
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Files:</span>
                  <span>{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ready:</span>
                  <span className={files.length >= 2 ? 'text-green-600' : 'text-red-600'}>
                    {files.length >= 2 ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={analyzeFiles}
              disabled={files.length < 2 || analyzing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium disabled:bg-gray-300"
            >
              {analyzing ? 'Analyzing...' : 'Check Plagiarism'}
            </button>
            
            {files.length > 0 && (
              <button
                onClick={clearFiles}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium"
              >
                Clear Files
              </button>
            )}
          </div>
        </div>

        {results.length > 0 && <Results results={results} />}
      </main>
    </div>
  );
}

export default App;