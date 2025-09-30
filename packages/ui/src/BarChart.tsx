import React from 'react';

export interface BarChartProps {
  data: {
    A: number;
    B: number;
  };
  labels?: {
    A: string;
    B: string;
  };
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  labels = { A: 'MC A', B: 'MC B' },
  className = '' 
}) => {
  const total = data.A + data.B;
  const percentageA = total > 0 ? (data.A / total) * 100 : 0;
  const percentageB = total > 0 ? (data.B / total) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Total votes */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{total}</div>
        <div className="text-sm text-gray-600">Total Votes</div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {/* MC A */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{labels.A}</span>
            <span className="text-sm text-gray-600">{data.A} ({percentageA.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className="bg-blue-600 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${Math.max(percentageA, 2)}%` }}
            >
              {percentageA > 10 && (
                <span className="text-white text-xs font-medium">{data.A}</span>
              )}
            </div>
          </div>
        </div>

        {/* MC B */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{labels.B}</span>
            <span className="text-sm text-gray-600">{data.B} ({percentageB.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className="bg-red-600 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${Math.max(percentageB, 2)}%` }}
            >
              {percentageB > 10 && (
                <span className="text-white text-xs font-medium">{data.B}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
