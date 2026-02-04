import React, { useMemo } from 'react';
import { calculateLongevityScore } from '../../lib/longevityScore';
import ShareScoreCard from '../ShareScoreCard';

// Helper component for score breakdown items
function ScoreMiniItem({ icon, label, score }) {
    const getColor = (s) => {
        if (s >= 70) return 'text-green-400';
        if (s >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-2 py-1.5">
            <span className="text-sm">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-400 block truncate">{label}</span>
            </div>
            <span className={`text-xs font-semibold ${getColor(score)}`}>{score}</span>
        </div>
    );
}

// Main LongevityScoreWidget Component
export default function LongevityScoreWidget({ intakeData, userName, compact = false }) {
    const scoreData = useMemo(() => {
        if (!intakeData) return null;
        try {
            return calculateLongevityScore(intakeData);
        } catch (e) {
            console.error('Error calculating score:', e);
            return null;
        }
    }, [intakeData]);

    if (!scoreData) return null;

    const {
        score,
        scoreLabel,
        chronologicalAge,
        biologicalAge,
        biologicalAgeDiff,
        potentialGainYears,
        potentialGainWeeks,
        weeksLived,
        currentRemainingWeeks,
        optimizedRemainingWeeks,
        breakdown
    } = scoreData;

    // Compact Life in Weeks Grid
    const LifeWeeksCompact = () => {
        const WEEKS_PER_YEAR = 52;
        const MAX_YEARS = 90;

        const getWeekStatus = (weekIndex) => {
            if (weekIndex < weeksLived) return 'lived';
            if (weekIndex < weeksLived + currentRemainingWeeks) return 'current';
            if (weekIndex < weeksLived + optimizedRemainingWeeks) return 'potential';
            return 'beyond';
        };

        const statusColors = {
            lived: 'bg-slate-600',
            current: 'bg-slate-500',
            potential: 'bg-amber-500',
            beyond: 'bg-slate-800/50'
        };

        // Show condensed view - sample decades
        const decades = [0, 20, 40, 60, 80];

        return (
            <div className="space-y-1">
                {decades.map((decade) => {
                    const startWeek = decade * WEEKS_PER_YEAR;
                    // Sample 20 weeks per decade for compact view
                    const samples = [];
                    for (let i = 0; i < 20; i++) {
                        samples.push(startWeek + i * 2.6 * WEEKS_PER_YEAR / 20);
                    }

                    return (
                        <div key={decade} className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 w-4">{decade}</span>
                            <div className="flex gap-px">
                                {samples.map((weekIdx, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-sm ${statusColors[getWeekStatus(Math.floor(weekIdx))]}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const circumference = 2 * Math.PI * 32;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // COMPACT MODE for sidebar
    if (compact) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Longevity Score</h3>
                    <span className="text-xs text-slate-500">Profil-basiert</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compact Score Circle */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-16 h-16" viewBox="0 0 72 72">
                            <circle cx="36" cy="36" r="32" fill="none" stroke="#334155" strokeWidth="6" />
                            <circle
                                cx="36" cy="36" r="32"
                                fill="none"
                                stroke={scoreLabel.color}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 36 36)"
                                className="transition-all duration-700"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-white">{score}</span>
                        </div>
                    </div>

                    {/* Compact Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span>{scoreLabel.emoji}</span>
                            <span className="font-semibold text-sm" style={{ color: scoreLabel.color }}>{scoreLabel.text}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Bio. Alter: <span className={biologicalAgeDiff <= 0 ? 'text-green-400' : 'text-red-400'}>{biologicalAge}</span>
                            <span className="text-slate-500 ml-1">({biologicalAgeDiff <= 0 ? '' : '+'}{biologicalAgeDiff})</span>
                        </p>
                        {potentialGainYears > 0 && (
                            <p className="text-amber-400 text-xs font-medium mt-1">
                                +{potentialGainYears} Jahre möglich
                            </p>
                        )}
                    </div>
                </div>

                {/* Compact Breakdown */}
                {breakdown && (
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                        <ScoreMiniItem icon="🌙" label="Schlaf" score={breakdown.sleep.score} />
                        <ScoreMiniItem icon="🧘" label="Stress" score={breakdown.stress.score} />
                        <ScoreMiniItem icon="🏃" label="Bewegung" score={breakdown.movement.score} />
                        <ScoreMiniItem icon="🥗" label="Ernährung" score={breakdown.nutrition.score} />
                    </div>
                )}
            </div>
        );
    }

    // FULL MODE (original)
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Longevity Score</h3>
                <span className="text-xs text-slate-500">Basierend auf deinem Profil</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Circle */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        <svg className="w-20 h-20" viewBox="0 0 72 72">
                            <circle cx="36" cy="36" r="32" fill="none" stroke="#334155" strokeWidth="6" />
                            <circle
                                cx="36" cy="36" r="32"
                                fill="none"
                                stroke={scoreLabel.color}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 36 36)"
                                className="transition-all duration-700"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-white">{score}</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">{scoreLabel.emoji}</span>
                            <span className="font-semibold" style={{ color: scoreLabel.color }}>{scoreLabel.text}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Bio. Alter: <span className={biologicalAgeDiff <= 0 ? 'text-green-400' : 'text-red-400'}>{biologicalAge}</span>
                            <span className="text-slate-500 ml-1">({biologicalAgeDiff <= 0 ? '' : '+'}{biologicalAgeDiff})</span>
                        </p>
                        {potentialGainYears > 0 && (
                            <p className="text-amber-400 text-sm font-medium mt-1">
                                +{potentialGainYears} Jahre möglich
                            </p>
                        )}
                    </div>
                </div>

                {/* Life in Weeks Compact */}
                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-500 mb-2">Dein Leben in Wochen</span>
                    <LifeWeeksCompact />
                    <div className="flex gap-3 mt-2 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-600"></span>Gelebt</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500"></span>+Potenzial</span>
                    </div>
                </div>

                {/* Breakdown Mini */}
                <div className="grid grid-cols-2 gap-2">
                    {breakdown && (
                        <>
                            <ScoreMiniItem icon="🌙" label="Schlaf" score={breakdown.sleep.score} />
                            <ScoreMiniItem icon="🧘" label="Stress" score={breakdown.stress.score} />
                            <ScoreMiniItem icon="🏃" label="Bewegung" score={breakdown.movement.score} />
                            <ScoreMiniItem icon="🥗" label="Ernährung" score={breakdown.nutrition.score} />
                        </>
                    )}
                </div>
            </div>

            {/* Motivation Text */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-sm text-slate-400 mb-4">
                    {score >= 70
                        ? "Du investierst in deine Zukunft. Weiter so! 🌟"
                        : score >= 40
                            ? "Jeder Tag zählt. Heute ist der perfekte Tag für Veränderung."
                            : "Kleine Änderungen, große Wirkung. Starte mit einer Sache."}
                </p>

                {/* Share Score Button */}
                <div className="max-w-xs mx-auto">
                    <ShareScoreCard
                        score={score}
                        userName={userName || intakeData?.name}
                    />
                </div>
            </div>
        </div>
    );
}
