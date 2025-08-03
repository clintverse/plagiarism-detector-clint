import React, { useState, useCallback } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import FileUpload from './components/FileUpload.jsx';
import ComparisonResults from './components/ComparisonResults.jsx';
import { analyzeFiles } from './utils/analysisEngine.js';

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFilesUpload = useCallback((uploadedFiles) => {
    setFiles(uploadedFiles);
    setResults([]);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 files for comparison');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResults = await analyzeFiles(files);
      setResults(analysisResults);
    } catch (err) {
      setError('Analysis failed. Please check your files and try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [files]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    
    window.dispatchEvent(new CustomEvent('clearFiles'));
    
    setTimeout(() => {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        input.value = '';
        input.files = null;
      });
    }, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Plagiarism Detector</h1>
                <p className="text-sm text-slate-600">Secure offline analysis for essays and documents</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            <span>Essay Analysis Mode</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Detect Text Similarity
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload essays, reports, or documents to detect potential plagiarism using advanced TF-IDF analysis.
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <FileUpload
              onFilesUpload={handleFilesUpload}
              isAnalyzing={isAnalyzing}
            />
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Files uploaded:</span>
                  <span className="text-sm font-medium text-slate-900">{files.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Analysis mode:</span>
                  <span className="text-sm font-medium text-blue-600">Essay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    files.length >= 2 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {files.length >= 2 ? 'Ready' : 'Need more files'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={files.length < 2 || isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Start Analysis</span>
                  </>
                )}
              </button>
              
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  disabled={isAnalyzing}
                  className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Clear All Files
                </button>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Upload at least 2 files for comparison</li>
                <li>• Supports .txt, .md, .doc, .docx files</li>
                <li>• All analysis is done locally for privacy</li>
                <li>• Results show similarity percentages</li>
              </ul>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <ComparisonResults results={results} />
        )}
      </main>
    </div>
  );
}

export default App;