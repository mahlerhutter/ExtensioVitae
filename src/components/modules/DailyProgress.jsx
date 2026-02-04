import React from 'react';

/**
 * Daily Progress Component
 *
 * Circular progress ring with completion stats.
 * Similar to existing ProgressRing but with streak support.
 */
export default function DailyProgress({ completed, total, streak = 0, size = 64 }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SVG calculations
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = () => {
    if (percentage === 100) return '#fbbf24'; // amber-400
    if (percentage >= 75) return '#22c55e'; // green-500
    if (percentage >= 50) return '#3b82f6'; // blue-500
    return '#64748b'; // slate-500
  };

  return (
    <div className="flex items-center gap-3">
      {/* Progress Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {percentage}%
          </span>
        </div>

        {/* Completion celebration */}
        {percentage === 100 && (
          <div className="absolute -top-1 -right-1">
            <span className="text-lg">✨</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="text-white font-medium">
          {completed}/{total}
        </p>
        <p className="text-xs text-slate-400">
          {percentage === 100 ? 'Complete!' : 'Tasks'}
        </p>
      </div>
    </div>
  );
}
