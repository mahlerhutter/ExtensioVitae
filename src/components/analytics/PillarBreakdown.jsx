import React from 'react';

/**
 * Pillar Breakdown Component
 *
 * Shows distribution of completed tasks by pillar.
 */

const PILLAR_CONFIG = {
  nutrition: {
    name_de: 'Ernährung',
    name_en: 'Nutrition',
    color: 'bg-green-500',
    icon: '🥗'
  },
  exercise: {
    name_de: 'Bewegung',
    name_en: 'Exercise',
    color: 'bg-orange-500',
    icon: '🏃'
  },
  sleep: {
    name_de: 'Schlaf',
    name_en: 'Sleep',
    color: 'bg-indigo-500',
    icon: '😴'
  },
  stress: {
    name_de: 'Stress',
    name_en: 'Stress',
    color: 'bg-purple-500',
    icon: '🧘'
  },
  mindfulness: {
    name_de: 'Achtsamkeit',
    name_en: 'Mindfulness',
    color: 'bg-cyan-500',
    icon: '🧠'
  },
  supplements: {
    name_de: 'Supplements',
    name_en: 'Supplements',
    color: 'bg-amber-500',
    icon: '💊'
  },
  social: {
    name_de: 'Soziales',
    name_en: 'Social',
    color: 'bg-pink-500',
    icon: '👥'
  },
  hydration: {
    name_de: 'Hydration',
    name_en: 'Hydration',
    color: 'bg-blue-500',
    icon: '💧'
  },
  recovery: {
    name_de: 'Erholung',
    name_en: 'Recovery',
    color: 'bg-teal-500',
    icon: '🌿'
  },
  other: {
    name_de: 'Sonstiges',
    name_en: 'Other',
    color: 'bg-slate-500',
    icon: '📋'
  }
};

export default function PillarBreakdown({ distribution, language = 'de' }) {
  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-500 text-sm">
          {language === 'de' ? 'Keine Daten' : 'No data'}
        </p>
      </div>
    );
  }

  // Calculate total
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;

  // Sort by count descending
  const sorted = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      {sorted.map(([pillar, count]) => {
        const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.other;
        const percentage = (count / total) * 100;

        return (
          <div key={pillar} className="flex items-center gap-3">
            {/* Icon */}
            <span className="text-lg w-6 text-center">{config.icon}</span>

            {/* Label */}
            <div className="w-20 truncate">
              <span className="text-sm text-white">
                {language === 'de' ? config.name_de : config.name_en}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 h-6 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.color} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Count */}
            <div className="w-12 text-right">
              <span className="text-sm text-slate-400">{count}</span>
              <span className="text-xs text-slate-500 ml-1">
                ({Math.round(percentage)}%)
              </span>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-3 border-t border-slate-700 flex justify-between">
        <span className="text-sm text-slate-400">
          {language === 'de' ? 'Gesamt' : 'Total'}
        </span>
        <span className="text-sm text-white font-medium">{total}</span>
      </div>
    </div>
  );
}
