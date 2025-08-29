import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const Results = ({ results }) => {
  const getStatus = (similarity) => {
    if (similarity >= 70) return { color: 'red', label: 'High Similarity', icon: AlertTriangle };
    if (similarity >= 40) return { color: 'yellow', label: 'Medium Similarity', icon: AlertTriangle };
    return { color: 'green', label: 'Low Similarity', icon: CheckCircle };
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
      
      <div className="grid gap-4">
        {results.map((result, index) => {
          const status = getStatus(result.similarity);
          const Icon = status.icon;
          
          return (
            <div key={index} className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {result.file1} vs {result.file2}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${
                      status.color === 'red' ? 'text-red-500' :
                      status.color === 'yellow' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className={`text-sm ${
                      status.color === 'red' ? 'text-red-700' :
                      status.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    status.color === 'red' ? 'text-red-600' :
                    status.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {result.similarity}%
                  </div>
                  <div className="text-xs text-gray-500">similarity</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Results;