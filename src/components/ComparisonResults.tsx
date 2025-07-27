import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Download, BarChart3 } from 'lucide-react';
import { ComparisonResult } from '../types';
import SimilarityMeter from './SimilarityMeter';

interface ComparisonResultsProps {
  results: ComparisonResult[];
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ results }) => {
  const [sortBy, setSortBy] = useState<'similarity' | 'name'>('similarity');

  const getSimilarityLevel = (similarity: number) => {
    if (similarity >= 70) return { level: 'high', color: 'red', label: 'High Risk' };
    if (similarity >= 40) return { level: 'medium', color: 'yellow', label: 'Moderate Risk' };
    return { level: 'low', color: 'green', label: 'Low Risk' };
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'similarity') {
      return b.similarity - a.similarity;
    }
    return a.file1.name.localeCompare(b.file1.name);
  });

  const exportResults = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      mode: 'essay',
      totalComparisons: results.length,
      results: results.map(r => ({
        file1: r.file1.name,
        file2: r.file2.name,
        similarity: r.similarity,
        confidence: r.confidence,
        matchCount: r.matches.length
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plagiarism-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
            <p className="text-sm text-slate-600 mt-1">
              Found {results.length} comparison{results.length !== 1 ? 's' : ''} • Essay analysis mode
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'similarity' | 'name')}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="similarity">Sort by Similarity</option>
              <option value="name">Sort by Name</option>
            </select>
            
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Average Similarity</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {(results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">High Risk</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-2">
              {results.filter(r => r.similarity >= 70).length}
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Moderate</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">
              {results.filter(r => r.similarity >= 40 && r.similarity < 70).length}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Safe</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {results.filter(r => r.similarity < 40).length}
            </p>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {sortedResults.map((result) => {
          const { level, color, label } = getSimilarityLevel(result.similarity);
          
          return (
            <div
              key={result.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        color === 'red' ? 'bg-red-100 text-red-800' :
                        color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {label}
                      </span>
                      <span className="text-sm text-slate-500">
                        {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''} found
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {result.file1.name} ↔ {result.file2.name}
                    </h3>
                    
                    <div className="text-sm text-slate-600">
                      Confidence: {result.confidence.toFixed(1)}% • Analysis: {result.analysisType}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <SimilarityMeter similarity={result.similarity} size="large" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonResults;