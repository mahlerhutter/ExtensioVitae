import React, { useEffect, useState } from 'react';

export default function ScoreGauge({ score }) {
    const [displayScore, setDisplayScore] = useState(0);

    // Animation settings
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (displayScore / 100) * circumference;

    useEffect(() => {
        let startTime;
        const duration = 1500; // 1.5s

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function (easeOutQuart)
            const ease = 1 - Math.pow(1 - percentage, 4);

            setDisplayScore(Math.floor(ease * score));

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                setDisplayScore(score);
            }
        };

        requestAnimationFrame(animate);
    }, [score]);

    // Determine color
    const getColor = (val) => {
        if (val < 50) return '#ef4444'; // Red-500
        if (val <= 75) return '#fbbf24'; // Amber-400
        return '#10b981'; // Emerald-500
    };

    const color = getColor(displayScore);

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                {/* Background Circle */}
                <svg
                    height="100%"
                    width="100%"
                    className="transform -rotate-90"
                >
                    <circle
                        stroke="#1e293b" // slate-800
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                    />
                    {/* Progress Circle */}
                    <circle
                        stroke={color}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease'
                        }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                    />
                </svg>

                {/* Text Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl md:text-7xl font-bold transition-colors duration-500`} style={{ color }}>
                        {displayScore}
                    </span>
                </div>
            </div>

            <p className="mt-4 text-slate-400 text-sm uppercase tracking-widest font-medium">
                Biological Baseline
            </p>
        </div>
    );
}
