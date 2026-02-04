import React from 'react';

/**
 * Active Module Card Component
 *
 * Shows an active module with progress, timeline, and quick stats.
 */
export default function ActiveModuleCard({ module, tasks, language = 'de', onClick }) {
  // Support both 'definition' and 'module' property names for backwards compatibility
  const definition = module.definition || module.module;
  const {
    started_at,
    completion_rate
  } = module;

  // Ensure we have valid numbers for current_day and total_days
  const current_day = module.current_day || 1;
  const total_days = module.total_days || definition?.duration_days || 30;

  const name = language === 'de'
    ? (definition?.name_de || definition?.name || 'Unbenanntes Modul')
    : (definition?.name_en || definition?.name_de || definition?.name || 'Unnamed Module');
  const progressPercent = total_days > 0 ? Math.min((current_day / total_days) * 100, 100) : 0;

  // Tasks for today from this module
  const todayTasksCount = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.completed).length || 0;

  // Calculate days remaining (ensure not negative)
  const daysRemaining = Math.max(0, total_days - current_day);

  // Get pillar icons for this module
  const pillars = definition?.pillars || [];

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group"
    >
      {/* Decorative gradient based on module type */}
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getModuleGradient(definition?.category)}`} />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Module icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">
            {definition?.icon || '📋'}
          </div>

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate group-hover:text-amber-400 transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">
                {language === 'de' ? `Tag ${current_day} von ${total_days}` : `Day ${current_day} of ${total_days}`}
              </span>
              {daysRemaining <= 7 && daysRemaining > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {daysRemaining}d {language === 'de' ? 'übrig' : 'left'}
                </span>
              )}
            </div>
          </div>

          {/* Today's progress for this module */}
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              {completedTasks}/{todayTasksCount}
            </div>
            <div className="text-xs text-slate-500">
              {language === 'de' ? 'heute' : 'today'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{language === 'de' ? 'Fortschritt' : 'Progress'}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pillars affected */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1">
            {pillars.slice(0, 4).map((pillar, i) => {
              const config = PILLAR_CONFIG[pillar];
              return (
                <div
                  key={pillar}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-slate-800 ${config?.bg || 'bg-slate-700'}`}
                  title={config?.[language] || pillar}
                >
                  {config?.icon || '📋'}
                </div>
              );
            })}
            {pillars.length > 4 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-700 border-2 border-slate-800 text-slate-400">
                +{pillars.length - 4}
              </div>
            )}
          </div>

          {/* View details hint */}
          <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
            {language === 'de' ? 'Details' : 'Details'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Timeline indicator at bottom */}
      <div className="h-1 bg-slate-700/30">
        <div
          className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

// Module gradient based on category
function getModuleGradient(category) {
  const gradients = {
    nutrition: 'from-green-500 to-emerald-600',
    exercise: 'from-orange-500 to-red-500',
    sleep: 'from-indigo-500 to-purple-600',
    mindfulness: 'from-cyan-500 to-blue-500',
    fasting: 'from-amber-500 to-orange-500',
    supplements: 'from-yellow-500 to-amber-500',
    recovery: 'from-teal-500 to-green-500',
    plans: 'from-purple-500 to-pink-500'
  };
  return gradients[category] || 'from-slate-600 to-slate-700';
}

// Pillar configuration
const PILLAR_CONFIG = {
  sleep: { de: 'Schlaf', en: 'Sleep', icon: '😴', bg: 'bg-indigo-500/30' },
  nutrition: { de: 'Ernährung', en: 'Nutrition', icon: '🥗', bg: 'bg-green-500/30' },
  exercise: { de: 'Bewegung', en: 'Exercise', icon: '🏃', bg: 'bg-orange-500/30' },
  stress: { de: 'Stress', en: 'Stress', icon: '🧘', bg: 'bg-purple-500/30' },
  mindfulness: { de: 'Achtsamkeit', en: 'Mindfulness', icon: '🧠', bg: 'bg-cyan-500/30' },
  supplements: { de: 'Supplements', en: 'Supplements', icon: '💊', bg: 'bg-amber-500/30' },
  connection: { de: 'Verbindung', en: 'Connection', icon: '👥', bg: 'bg-pink-500/30' },
  environment: { de: 'Umwelt', en: 'Environment', icon: '🌿', bg: 'bg-teal-500/30' }
};
