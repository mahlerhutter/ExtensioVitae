import React, { useState } from 'react';

// Pillar configuration
const PILLARS = {
  sleep: { label_de: 'Schlaf', label_en: 'Sleep', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
  movement: { label_de: 'Bewegung', label_en: 'Movement', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  nutrition: { label_de: 'Ernährung', label_en: 'Nutrition', color: 'bg-orange-500', textColor: 'text-orange-400' },
  stress: { label_de: 'Stress', label_en: 'Stress', color: 'bg-rose-500', textColor: 'text-rose-400' },
  connection: { label_de: 'Verbindung', label_en: 'Connection', color: 'bg-blue-500', textColor: 'text-blue-400' },
  mental: { label_de: 'Mental', label_en: 'Mental', color: 'bg-purple-500', textColor: 'text-purple-400' },
  supplements: { label_de: 'Supplements', label_en: 'Supplements', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  recovery: { label_de: 'Erholung', label_en: 'Recovery', color: 'bg-teal-500', textColor: 'text-teal-400' },
  general: { label_de: 'Allgemein', label_en: 'General', color: 'bg-slate-500', textColor: 'text-slate-400' }
};

// Skip reasons
const SKIP_REASONS = [
  { id: 'no_time', label_de: 'Keine Zeit', label_en: 'No time' },
  { id: 'not_feeling_well', label_de: 'Fühle mich nicht gut', label_en: 'Not feeling well' },
  { id: 'already_done', label_de: 'Bereits erledigt', label_en: 'Already done' },
  { id: 'not_applicable', label_de: 'Nicht zutreffend', label_en: 'Not applicable' }
];

/**
 * Module Task Item Component
 *
 * Individual task from the modular tracking system.
 * Supports completion, skip with reason, and undo.
 */
export default function ModuleTaskItem({ task, language = 'de', onComplete, onSkip, onUndo }) {
  const [showSkipMenu, setShowSkipMenu] = useState(false);

  const pillar = PILLARS[task.pillar] || PILLARS.general;
  const isCompleted = task.status === 'completed';
  const isSkipped = task.status === 'skipped';
  const isPending = task.status === 'pending';

  const handleClick = () => {
    if (isPending) {
      onComplete();
    }
  };

  const handleSkipClick = (e) => {
    e.stopPropagation();
    setShowSkipMenu(!showSkipMenu);
  };

  const handleSkipReason = (reason) => {
    onSkip(reason);
    setShowSkipMenu(false);
  };

  const handleUndo = (e) => {
    e.stopPropagation();
    onUndo();
  };

  return (
    <div className="relative">
      <div
        onClick={handleClick}
        className={`flex items-start gap-4 p-4 rounded-lg transition-all cursor-pointer
          ${isCompleted ? 'bg-slate-800/30' : ''}
          ${isSkipped ? 'bg-slate-800/20 opacity-60' : ''}
          ${isPending ? 'bg-slate-800/60 hover:bg-slate-800' : ''}
        `}
      >
        {/* Checkbox */}
        <button
          onClick={handleClick}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
            ${isCompleted
              ? 'bg-amber-400 border-amber-400'
              : isSkipped
                ? 'bg-slate-600 border-slate-600'
                : 'border-slate-600 hover:border-amber-400'
            }`}
        >
          {isCompleted && (
            <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {isSkipped && (
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Module & Pillar */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${pillar.color}`} />
            <span className={`text-xs font-medium ${pillar.textColor}`}>
              {language === 'de' ? pillar.label_de : pillar.label_en}
            </span>
            {task.source_module && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-500">{task.source_module}</span>
              </>
            )}
          </div>

          {/* Task title */}
          <p className={`text-sm leading-relaxed ${
            isCompleted ? 'text-slate-500 line-through' :
            isSkipped ? 'text-slate-600 line-through' :
            'text-slate-200'
          }`}>
            {language === 'de' ? task.title_de : task.title_en}
          </p>

          {/* Description if available */}
          {task.description && isPending && (
            <p className="text-xs text-slate-500 mt-1">{task.description}</p>
          )}

          {/* Skip reason */}
          {isSkipped && task.skipped_reason && (
            <p className="text-xs text-slate-600 mt-1 italic">
              {language === 'de' ? 'Übersprungen' : 'Skipped'}: {task.skipped_reason}
            </p>
          )}
        </div>

        {/* Right side: Time & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Scheduled time */}
          {task.scheduled_time && (
            <span className={`text-sm ${isPending ? 'text-amber-400/80' : 'text-slate-600'}`}>
              {task.scheduled_time}
            </span>
          )}

          {/* Duration */}
          <span className="text-slate-500 text-sm whitespace-nowrap">
            {task.duration_minutes} min
          </span>

          {/* Actions */}
          {isPending && (
            <button
              onClick={handleSkipClick}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors"
              title={language === 'de' ? 'Überspringen' : 'Skip'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {(isCompleted || isSkipped) && (
            <button
              onClick={handleUndo}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors"
              title={language === 'de' ? 'Rückgängig' : 'Undo'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Skip menu */}
      {showSkipMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSkipMenu(false)}
          />
          <div className="absolute right-4 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[180px]">
            <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
              {language === 'de' ? 'Grund wählen' : 'Select reason'}
            </div>
            {SKIP_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleSkipReason(reason.id)}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                {language === 'de' ? reason.label_de : reason.label_en}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
