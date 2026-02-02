import React, { useMemo } from 'react';

/**
 * Life in Weeks Visualization Component
 *
 * Zeigt das Leben als Grid von Wochen (52 pro Reihe = 1 Jahr)
 * Inspiriert von Tim Urban's "Your Life in Weeks"
 *
 * Props:
 * - weeksLived: Anzahl bereits gelebter Wochen
 * - currentRemainingWeeks: Verbleibende Wochen bei aktuellem Lifestyle
 * - optimizedRemainingWeeks: Verbleibende Wochen mit Optimierung
 * - showPotential: Ob der Gewinn durch ExtensioVitae gezeigt werden soll
 * - compact: Kompakte Ansicht für Dashboard
 * - maxYears: Maximale Jahre im Grid (default: 90)
 */
export default function LifeInWeeks({
    weeksLived = 0,
    currentRemainingWeeks = 0,
    optimizedRemainingWeeks = 0,
    showPotential = true,
    compact = false,
    maxYears = 90,
    chronologicalAge = 0
}) {
    const WEEKS_PER_YEAR = 52;
    const totalWeeks = maxYears * WEEKS_PER_YEAR;

    const potentialGainWeeks = optimizedRemainingWeeks - currentRemainingWeeks;
    const potentialGainYears = (potentialGainWeeks / WEEKS_PER_YEAR).toFixed(1);

    // Generate week grid data
    const weekData = useMemo(() => {
        const weeks = [];
        for (let i = 0; i < totalWeeks; i++) {
            let status;
            if (i < weeksLived) {
                status = 'lived';
            } else if (i < weeksLived + currentRemainingWeeks) {
                status = 'current';
            } else if (showPotential && i < weeksLived + optimizedRemainingWeeks) {
                status = 'potential';
            } else {
                status = 'beyond';
            }
            weeks.push(status);
        }
        return weeks;
    }, [weeksLived, currentRemainingWeeks, optimizedRemainingWeeks, showPotential, totalWeeks]);

    // Decade markers
    const decades = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(d => d <= maxYears);

    // Box size based on compact mode
    const boxSize = compact ? 'w-1 h-1' : 'w-1.5 h-1.5 sm:w-2 sm:h-2';
    const gap = compact ? 'gap-px' : 'gap-0.5';

    return (
        <div className="life-in-weeks">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`font-semibold text-slate-800 ${compact ? 'text-sm' : 'text-lg'}`}>
                        Dein Leben in Wochen
                    </h3>
                    {!compact && (
                        <p className="text-sm text-slate-500">
                            Jede Box = 1 Woche • Jede Reihe = 1 Jahr
                        </p>
                    )}
                </div>

                {showPotential && potentialGainWeeks > 0 && (
                    <div className="text-right">
                        <div className="flex items-center gap-1">
                            <span className="text-amber-500 text-xl">+{potentialGainYears}</span>
                            <span className="text-sm text-slate-600">Jahre</span>
                        </div>
                        <p className="text-xs text-slate-500">mit ExtensioVitae</p>
                    </div>
                )}
            </div>

            {/* Week Grid */}
            <div className="relative">
                {/* Decade labels on the left */}
                <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400">
                    {decades.map(decade => (
                        <span
                            key={decade}
                            style={{ position: 'absolute', top: `${(decade / maxYears) * 100}%`, transform: 'translateY(-50%)' }}
                        >
                            {decade}
                        </span>
                    ))}
                </div>

                {/* Current age marker */}
                {chronologicalAge > 0 && chronologicalAge < maxYears && (
                    <div
                        className="absolute -left-2 w-1 bg-amber-500 rounded-full z-10"
                        style={{
                            top: `${(chronologicalAge / maxYears) * 100}%`,
                            height: '2px',
                            width: '100%',
                            opacity: 0.5
                        }}
                    />
                )}

                {/* Grid Container */}
                <div
                    className={`grid ${gap} ml-2`}
                    style={{
                        gridTemplateColumns: `repeat(${WEEKS_PER_YEAR}, minmax(0, 1fr))`
                    }}
                >
                    {weekData.map((status, index) => (
                        <div
                            key={index}
                            className={`${boxSize} rounded-sm transition-colors ${getStatusClasses(status)}`}
                            title={getWeekTooltip(index, status, WEEKS_PER_YEAR)}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className={`flex flex-wrap gap-4 mt-4 ${compact ? 'text-xs' : 'text-sm'}`}>
                <LegendItem color="bg-navy-800" label="Gelebt" />
                <LegendItem color="bg-slate-400" label="Aktuelle Prognose" />
                {showPotential && <LegendItem color="bg-amber-500" label="+ mit ExtensioVitae" />}
                <LegendItem color="bg-slate-200" label="Jenseits" />
            </div>

            {/* Stats */}
            {!compact && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200">
                    <StatBox
                        value={Math.round(weeksLived / WEEKS_PER_YEAR)}
                        label="Jahre gelebt"
                        sublabel={`${weeksLived.toLocaleString()} Wochen`}
                    />
                    <StatBox
                        value={Math.round(currentRemainingWeeks / WEEKS_PER_YEAR)}
                        label="Jahre verbleibend"
                        sublabel="aktuelle Prognose"
                        muted
                    />
                    {showPotential && (
                        <StatBox
                            value={`+${potentialGainYears}`}
                            label="Jahre Potenzial"
                            sublabel={`${potentialGainWeeks.toLocaleString()} Wochen`}
                            highlight
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// Helper Components
function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-slate-600">{label}</span>
        </div>
    );
}

function StatBox({ value, label, sublabel, muted, highlight }) {
    return (
        <div className={`text-center ${muted ? 'opacity-60' : ''}`}>
            <div className={`text-2xl font-bold ${highlight ? 'text-amber-500' : 'text-slate-800'}`}>
                {value}
            </div>
            <div className="text-sm text-slate-600">{label}</div>
            {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
        </div>
    );
}

// Helper functions
function getStatusClasses(status) {
    switch (status) {
        case 'lived':
            return 'bg-slate-800'; // Navy/dark - already lived
        case 'current':
            return 'bg-slate-400'; // Medium gray - current projection
        case 'potential':
            return 'bg-amber-500'; // Gold - ExtensioVitae gain
        case 'beyond':
        default:
            return 'bg-slate-200'; // Light gray - beyond projection
    }
}

function getWeekTooltip(index, status, weeksPerYear) {
    const year = Math.floor(index / weeksPerYear);
    const week = (index % weeksPerYear) + 1;

    const statusLabels = {
        lived: 'Gelebt',
        current: 'Prognose',
        potential: 'Potenzial',
        beyond: '-'
    };

    return `Jahr ${year}, Woche ${week} (${statusLabels[status]})`;
}
