import React from 'react';

/**
 * Longevity Score Display Card
 *
 * Zeigt den Hauptscore + Breakdown + biologisches Alter
 *
 * Props:
 * - scoreData: Output von calculateLongevityScore()
 * - showBreakdown: Zeigt Detail-Breakdown
 * - compact: Kompakte Ansicht
 */
export default function LongevityScoreCard({
    scoreData,
    showBreakdown = true,
    compact = false
}) {
    if (!scoreData) return null;

    const {
        score,
        scoreLabel,
        chronologicalAge,
        biologicalAge,
        biologicalAgeDiff,
        currentExpectancy,
        optimizedExpectancy,
        potentialGainYears,
        breakdown
    } = scoreData;

    // Ring progress for main score
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={`bg-white rounded-2xl shadow-lg ${compact ? 'p-4' : 'p-6'}`}>
            {/* Main Score Section */}
            <div className="flex items-center gap-6">
                {/* Circular Score */}
                <div className="relative">
                    <svg className={compact ? "w-24 h-24" : "w-32 h-32"} viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={scoreLabel.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-1000 ease-out"
                        />
                        {/* Score text */}
                        <text
                            x="50"
                            y="45"
                            textAnchor="middle"
                            className="text-3xl font-bold fill-slate-800"
                            style={{ fontSize: compact ? '24px' : '28px' }}
                        >
                            {score}
                        </text>
                        <text
                            x="50"
                            y="62"
                            textAnchor="middle"
                            className="text-xs fill-slate-500"
                        >
                            von 100
                        </text>
                    </svg>
                </div>

                {/* Score Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{scoreLabel.emoji}</span>
                        <h3 className="text-xl font-semibold" style={{ color: scoreLabel.color }}>
                            {scoreLabel.text}
                        </h3>
                    </div>

                    {/* Biological vs Chronological Age */}
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-sm text-slate-600">Biologisches Alter:</span>
                        <span className={`text-lg font-bold ${biologicalAgeDiff <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {biologicalAge}
                        </span>
                        <span className="text-sm text-slate-500">
                            ({biologicalAgeDiff <= 0 ? '' : '+'}{biologicalAgeDiff} Jahre)
                        </span>
                    </div>

                    {/* Potential Gain */}
                    {potentialGainYears > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg w-fit">
                            <span className="text-amber-600 font-semibold">+{potentialGainYears} Jahre</span>
                            <span className="text-sm text-amber-700">möglich mit Optimierung</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Life Expectancy Bar */}
            {!compact && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Lebenserwartung</span>
                        <div className="flex gap-4">
                            <span className="text-slate-500">Aktuell: {currentExpectancy} J</span>
                            <span className="text-amber-600 font-medium">Optimiert: {optimizedExpectancy} J</span>
                        </div>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        {/* Current expectancy */}
                        <div
                            className="absolute h-full bg-slate-400 rounded-full"
                            style={{ width: `${(currentExpectancy / 100) * 100}%` }}
                        />
                        {/* Optimized expectancy */}
                        <div
                            className="absolute h-full bg-amber-500 rounded-full opacity-50"
                            style={{
                                left: `${(currentExpectancy / 100) * 100}%`,
                                width: `${((optimizedExpectancy - currentExpectancy) / 100) * 100}%`
                            }}
                        />
                        {/* Current age marker */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-800"
                            style={{ left: `${(chronologicalAge / 100) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0</span>
                        <span>↑ Du bist hier ({chronologicalAge})</span>
                        <span>100</span>
                    </div>
                </div>
            )}

            {/* Score Breakdown */}
            {showBreakdown && breakdown && (
                <div className={`grid grid-cols-2 gap-3 ${compact ? 'mt-4' : 'mt-6 pt-4 border-t border-slate-100'}`}>
                    <BreakdownItem
                        icon="🌙"
                        label="Schlaf"
                        score={breakdown.sleep.score}
                        status={breakdown.sleep.label}
                        tip={breakdown.sleep.improvementTip}
                        compact={compact}
                    />
                    <BreakdownItem
                        icon="🧘"
                        label="Stress"
                        score={breakdown.stress.score}
                        status={breakdown.stress.label}
                        tip={breakdown.stress.improvementTip}
                        compact={compact}
                    />
                    <BreakdownItem
                        icon="🏃"
                        label="Bewegung"
                        score={breakdown.movement.score}
                        status={breakdown.movement.label}
                        tip={breakdown.movement.improvementTip}
                        compact={compact}
                    />
                    <BreakdownItem
                        icon="🥗"
                        label="Ernährung"
                        score={breakdown.nutrition.score}
                        status={breakdown.nutrition.label}
                        tip={breakdown.nutrition.improvementTip}
                        compact={compact}
                    />
                </div>
            )}
        </div>
    );
}

function BreakdownItem({ icon, label, score, status, tip, compact }) {
    const getScoreColor = (score) => {
        if (score >= 70) return 'text-green-600 bg-green-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-500 bg-red-50';
    };

    return (
        <div className={`p-3 rounded-xl bg-slate-50 ${compact ? 'p-2' : 'p-3'}`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <span className={compact ? 'text-base' : 'text-lg'}>{icon}</span>
                    <span className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreColor(score)}`}>
                    {score}
                </span>
            </div>
            <div className={`text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>{status}</div>
            {!compact && tip && (
                <div className="mt-1.5 text-xs text-slate-400 italic">{tip}</div>
            )}
        </div>
    );
}
