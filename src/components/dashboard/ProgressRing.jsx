import React from 'react';

/**
 * Progress Ring Component
 * Circular progress indicator showing completed/total
 */
export default function ProgressRing({ completed, total }) {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const strokeWidth = 8;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-700"
                />
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-amber-400 transition-all duration-500"
                />
            </svg>
            <div className="absolute text-center">
                <span className="text-2xl font-semibold text-white">{completed}</span>
                <span className="text-slate-500">/{total}</span>
            </div>
        </div>
    );
}
