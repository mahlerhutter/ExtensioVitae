import React from 'react';

/**
 * Biomarker Card Component
 *
 * Displays a single biomarker value with status indicator and reference ranges.
 */
export default function BiomarkerCard({ biomarker, language = 'de', onClick }) {
  const { code, name_de, name_en, value, unit, status, optimal_min, optimal_max, normal_min, normal_max } = biomarker;

  const name = language === 'de' ? name_de : (name_en || name_de);

  // Status colors and icons
  const statusConfig = {
    optimal: { color: 'text-green-400', bg: 'bg-green-500/20', icon: '✓', label_de: 'Optimal', label_en: 'Optimal' },
    suboptimal_low: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '↓', label_de: 'Leicht niedrig', label_en: 'Slightly low' },
    suboptimal_high: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '↑', label_de: 'Leicht hoch', label_en: 'Slightly high' },
    low: { color: 'text-red-400', bg: 'bg-red-500/20', icon: '⬇', label_de: 'Niedrig', label_en: 'Low' },
    high: { color: 'text-red-400', bg: 'bg-red-500/20', icon: '⬆', label_de: 'Hoch', label_en: 'High' },
    unknown: { color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '?', label_de: 'Unbekannt', label_en: 'Unknown' }
  };

  const config = statusConfig[status] || statusConfig.unknown;
  const statusLabel = language === 'de' ? config.label_de : config.label_en;

  // Calculate position on range bar (0-100)
  const calculatePosition = () => {
    if (!normal_min || !normal_max || value === null || value === undefined) return 50;

    const range = normal_max - normal_min;
    const extendedMin = normal_min - range * 0.3;
    const extendedMax = normal_max + range * 0.3;
    const extendedRange = extendedMax - extendedMin;

    const position = ((value - extendedMin) / extendedRange) * 100;
    return Math.max(5, Math.min(95, position));
  };

  const markerPosition = calculatePosition();

  // Calculate optimal zone position for the bar
  const getOptimalZone = () => {
    if (!optimal_min || !optimal_max || !normal_min || !normal_max) return null;

    const range = normal_max - normal_min;
    const extendedMin = normal_min - range * 0.3;
    const extendedMax = normal_max + range * 0.3;
    const extendedRange = extendedMax - extendedMin;

    const left = ((optimal_min - extendedMin) / extendedRange) * 100;
    const right = ((optimal_max - extendedMin) / extendedRange) * 100;

    return { left: Math.max(0, left), width: Math.min(100, right) - Math.max(0, left) };
  };

  const optimalZone = getOptimalZone();

  return (
    <div
      className={`p-4 rounded-xl ${config.bg} border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer`}
      onClick={() => onClick?.(biomarker)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-medium">{name}</h4>
          <p className="text-xs text-slate-500 uppercase">{code}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
          <span>{config.icon}</span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-2xl font-bold ${config.color}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>

      {/* Range Bar */}
      {normal_min !== null && normal_max !== null && (
        <div className="relative">
          {/* Background bar */}
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            {/* Low zone */}
            <div className="absolute left-0 h-2 w-1/4 bg-red-500/30 rounded-l-full" />

            {/* Optimal zone */}
            {optimalZone && (
              <div
                className="absolute h-2 bg-green-500/40"
                style={{ left: `${optimalZone.left}%`, width: `${optimalZone.width}%` }}
              />
            )}

            {/* High zone */}
            <div className="absolute right-0 h-2 w-1/4 bg-red-500/30 rounded-r-full" />
          </div>

          {/* Value marker */}
          <div
            className="absolute top-0 w-3 h-3 -mt-0.5 rounded-full bg-white shadow-lg transform -translate-x-1/2"
            style={{ left: `${markerPosition}%` }}
          />

          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{normal_min}</span>
            {optimal_min && optimal_max && (
              <span className="text-green-400">
                {optimal_min}-{optimal_max}
              </span>
            )}
            <span>{normal_max}</span>
          </div>
        </div>
      )}

      {/* Trend indicator (if previous value exists) */}
      {biomarker.previousValue !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {language === 'de' ? 'Vorheriger Wert' : 'Previous value'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{biomarker.previousValue} {unit}</span>
              {value > biomarker.previousValue ? (
                <span className="text-green-400">↑</span>
              ) : value < biomarker.previousValue ? (
                <span className="text-red-400">↓</span>
              ) : (
                <span className="text-slate-400">→</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
