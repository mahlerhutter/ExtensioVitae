import React, { useState, useEffect } from 'react';

/**
 * Interactive Loading Component
 * Shows an animated, engaging loading screen while the plan is being loaded
 */
export default function InteractiveLoading({ message = 'Loading your plan...' }) {
    const [dots, setDots] = useState('');
    const [tipIndex, setTipIndex] = useState(0);

    const loadingTips = [
        '💡 Consistency beats intensity every time',
        '🌅 Morning sunlight helps regulate your circadian rhythm',
        '💪 Even 10 minutes of movement makes a difference',
        '🧘 Stress management is as important as exercise',
        '🥗 Whole foods fuel longevity',
        '😴 Quality sleep is your superpower',
        '🔬 Science-backed habits, personalized for you',
    ];

    // Animated dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % loadingTips.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Animated Logo/Icon */}
                <div className="relative">
                    <div className="w-24 h-24 mx-auto">
                        {/* Pulsing outer ring */}
                        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"></div>

                        {/* Rotating gradient ring */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-75 animate-spin"
                            style={{ animationDuration: '3s' }}></div>

                        {/* Inner circle */}
                        <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center">
                            <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Loading Message */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                        {message}{dots}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Preparing your personalized longevity blueprint
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse"
                        style={{
                            width: '100%',
                            animation: 'shimmer 2s infinite',
                        }}></div>
                </div>

                {/* Rotating Tips */}
                <div className="min-h-[60px] flex items-center justify-center">
                    <p className="text-slate-300 text-sm transition-opacity duration-500 px-4"
                        key={tipIndex}>
                        {loadingTips[tipIndex]}
                    </p>
                </div>

                {/* Animated Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-amber-400 animate-pulse">30</div>
                        <div className="text-xs text-slate-500">Days</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-emerald-400 animate-pulse" style={{ animationDelay: '0.2s' }}>6</div>
                        <div className="text-xs text-slate-500">Pillars</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-purple-400 animate-pulse" style={{ animationDelay: '0.4s' }}>∞</div>
                        <div className="text-xs text-slate-500">Impact</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
        </div>
    );
}
