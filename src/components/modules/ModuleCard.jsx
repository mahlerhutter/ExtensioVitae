import React from 'react';

// Category icons
const CATEGORY_ICONS = {
  nutrition: '🥗',
  exercise: '💪',
  sleep: '😴',
  supplements: '💊',
  mindset: '🧠',
  health: '❤️',
  general: '📋'
};

// Module type labels
const TYPE_LABELS = {
  recurring: { de: 'Täglich', en: 'Daily' },
  'one-time': { de: 'Einmalig', en: 'One-time' },
  continuous: { de: 'Fortlaufend', en: 'Continuous' }
};

/**
 * Module Card Component
 *
 * Displays a single module in the Module Hub.
 * Can be in discovery mode (showing activation) or active mode (showing controls).
 */
export default function ModuleCard({
  module,
  instance,
  language = 'de',
  isActive = false,
  isPaused = false,
  isDiscovery = false,
  onActivate,
  onPause,
  onResume,
  onDeactivate,
  onShowDetails
}) {
  const icon = module.icon || CATEGORY_ICONS[module.category] || '📦';
  const typeLabel = TYPE_LABELS[module.type] || TYPE_LABELS.recurring;

  // Calculate progress for active instances
  const progress = instance ? {
    day: instance.current_day || 1,
    total: instance.total_days,
    percentage: instance.completion_percentage || 0
  } : null;

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all
      ${isPaused ? 'bg-slate-800/30 border-slate-700/50 opacity-75' : 'bg-slate-800/50 border-slate-700'}
      ${isDiscovery && !isActive && !isPaused ? 'hover:border-amber-500/50 hover:bg-slate-800/70' : ''}
    `}>
      {/* Premium badge */}
      {module.is_premium && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Pro
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">
            {language === 'de' ? module.name_de : module.name_en}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">
              {language === 'de' ? typeLabel.de : typeLabel.en}
            </span>
            {module.duration_days && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-500">
                  {module.duration_days} {language === 'de' ? 'Tage' : 'Days'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status indicator & Details */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                {language === 'de' ? 'Aktiv' : 'Active'}
              </span>
            )}
            {isPaused && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                {language === 'de' ? 'Pausiert' : 'Paused'}
              </span>
            )}
          </div>

          {onShowDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
              className="text-[10px] text-amber-500/70 hover:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors group/link"
            >
              <span>{language === 'de' ? 'Details' : 'Details'}</span>
              <svg className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {language === 'de' ? module.description_de : module.description_en}
      </p>

      {/* Progress bar for active modules */}
      {progress && progress.total && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">
              {language === 'de' ? 'Tag' : 'Day'} {progress.day} / {progress.total}
            </span>
            <span className="text-amber-400">{progress.percentage}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Instance details */}
      {instance && !isDiscovery && (
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span>
            {language === 'de' ? 'Gestartet' : 'Started'}: {formatDate(instance.started_at)}
          </span>
          {instance.ends_at && (
            <span>
              {language === 'de' ? 'Endet' : 'Ends'}: {formatDate(instance.ends_at)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isDiscovery && !isActive && !isPaused && onActivate && (
          <button
            onClick={onActivate}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Aktivieren' : 'Activate'}
          </button>
        )}

        {isDiscovery && isActive && onPause && (
          <button
            onClick={onPause}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Pausieren' : 'Pause'}
          </button>
        )}

        {isDiscovery && isPaused && onResume && (
          <button
            onClick={onResume}
            className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Fortsetzen' : 'Resume'}
          </button>
        )}

        {!isDiscovery && !isPaused && onPause && (
          <button
            onClick={onPause}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Pausieren' : 'Pause'}
          </button>
        )}

        {!isDiscovery && isPaused && onResume && (
          <button
            onClick={onResume}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Fortsetzen' : 'Resume'}
          </button>
        )}

        {!isDiscovery && onDeactivate && (
          <button
            onClick={onDeactivate}
            className="px-4 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Deaktivieren' : 'Deactivate'}
          </button>
        )}
      </div>

      {/* Affected by modes hint */}
      {module.affected_by_modes?.length > 0 && (
        <p className="mt-3 text-xs text-slate-600">
          ⚠️ {language === 'de' ? 'Pausiert automatisch in' : 'Auto-pauses in'}:{' '}
          {module.affected_by_modes.join(', ')}
        </p>
      )}
    </div>
  );
}
