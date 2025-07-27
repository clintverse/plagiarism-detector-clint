import React from 'react';

interface SimilarityMeterProps {
  similarity: number;
  size?: 'small' | 'medium' | 'large';
}

const SimilarityMeter: React.FC<SimilarityMeterProps> = ({ similarity, size = 'medium' }) => {
  const getColor = (value: number) => {
    if (value >= 70) return 'text-red-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBackgroundColor = (value: number) => {
    if (value >= 70) return 'bg-red-600';
    if (value >= 40) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const sizes = {
    small: { container: 'w-16 h-16', text: 'text-xs', stroke: 4 },
    medium: { container: 'w-20 h-20', text: 'text-sm', stroke: 6 },
    large: { container: 'w-24 h-24', text: 'text-base', stroke: 8 }
  };

  const { container, text, stroke } = sizes[size];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (similarity / 100) * circumference;

  return (
    <div className={`relative ${container}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${getBackgroundColor(similarity)}`}
        />
      </svg>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`font-bold ${text} ${getColor(similarity)}`}>
            {similarity.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityMeter;