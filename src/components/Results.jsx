import React from 'react';
import { AlertTriangle, CheckCircle, FileText, BarChart3 } from 'lucide-react';

const Results = ({ results }) => {
  const getStatus = (similarity) => {
    if (similarity >= 70) return { 
      color: 'red', 
      label: 'High Similarity', 
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    };
    if (similarity >= 40) return { 
      color: 'yellow', 
      label: 'Medium Similarity', 
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    };
    return { 
      color: 'green', 
      label: 'Low Similarity', 
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    };
  };

  const averageSimilarity = results.length > 0 
    ? (results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(1)
    : 0;

  const highRisk = results.filter(r => r.similarity >= 70).length;
  const mediumRisk = results.filter(r => r.similarity >= 40 && r.similarity < 70).length;
  const lowRisk = results.filter(r => r.similarity < 40).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
            <p className="text-sm text-slate-600 mt-1">
              Found {results.length} comparison{results.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Average</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{averageSimilarity}%</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">High Risk</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-2">{highRisk}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">{mediumRisk}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Low Risk</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">{lowRisk}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => {
          const status = getStatus(result.similarity);
          const Icon = status.icon;
          
          return (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                      {status.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''} found
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {result.file1.name} ↔ {result.file2.name}
                  </h3>
                  
                  <div className="text-sm text-slate-600">
                    Confidence: {result.confidence.toFixed(1)}%
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    status.color === 'red' ? 'text-red-600' :
                    status.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {result.similarity}%
                  </div>
                  <div className="text-xs text-slate-500">similarity</div>
                </div>
              </div>

              {result.matches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Sample Matches:</h4>
                  <div className="space-y-2">
                    {result.matches.slice(0, 2).map((match, index) => (
                      <div key={index} className="text-xs bg-slate-50 rounded p-2">
                        <div className="text-slate-600 mb-1">"{match.text1.substring(0, 100)}..."</div>
                        <div className="text-slate-600">"{match.text2.substring(0, 100)}..."</div>
                        <div className="text-right text-slate-500 mt-1">{match.similarity}% match</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Results;