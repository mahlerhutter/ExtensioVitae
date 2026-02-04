import React, { useState } from 'react';

/**
 * Module Preview Component
 *
 * Detailed view of a module before activation.
 */
export default function ModulePreview({ module, language = 'de', onActivate, onBack }) {
  const [config, setConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    notifications: true
  });
  const [activating, setActivating] = useState(false);

  const name = language === 'de' ? module.name_de : (module.name_en || module.name_de);
  const description = language === 'de' ? module.description_de : (module.description_en || module.description_de);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate?.(config);
    } finally {
      setActivating(false);
    }
  };

  const getDifficultyInfo = (level) => {
    const info = {
      beginner: {
        de: { label: 'Anfänger', desc: 'Perfekt für den Einstieg', color: 'text-green-400' },
        en: { label: 'Beginner', desc: 'Perfect for getting started', color: 'text-green-400' }
      },
      intermediate: {
        de: { label: 'Mittel', desc: 'Etwas Erfahrung hilfreich', color: 'text-yellow-400' },
        en: { label: 'Intermediate', desc: 'Some experience helpful', color: 'text-yellow-400' }
      },
      advanced: {
        de: { label: 'Fortgeschritten', desc: 'Für erfahrene Nutzer', color: 'text-orange-400' },
        en: { label: 'Advanced', desc: 'For experienced users', color: 'text-orange-400' }
      },
      expert: {
        de: { label: 'Experte', desc: 'Höchste Anforderungen', color: 'text-red-400' },
        en: { label: 'Expert', desc: 'Highest requirements', color: 'text-red-400' }
      }
    };
    return info[level]?.[language] || { label: level, desc: '', color: 'text-slate-400' };
  };

  const getPillarInfo = (pillar) => {
    const pillars = {
      nutrition: { de: 'Ernährung', en: 'Nutrition', icon: '🥗' },
      exercise: { de: 'Bewegung', en: 'Exercise', icon: '🏃' },
      sleep: { de: 'Schlaf', en: 'Sleep', icon: '😴' },
      stress: { de: 'Stress', en: 'Stress', icon: '🧘' },
      mindfulness: { de: 'Achtsamkeit', en: 'Mindfulness', icon: '🧠' },
      supplements: { de: 'Supplements', en: 'Supplements', icon: '💊' }
    };
    const info = pillars[pillar];
    return info ? { name: info[language], icon: info.icon } : { name: pillar, icon: '📋' };
  };

  const difficultyInfo = getDifficultyInfo(module.difficulty_level);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{language === 'de' ? 'Zurück' : 'Back'}</span>
        </button>

        {/* Module header */}
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-3xl">
            {module.icon || '📋'}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              {module.is_premium && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                  PRO
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {module.duration_days && (
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <div className="text-lg font-bold text-white">{module.duration_days}</div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Tage' : 'Days'}
              </div>
            </div>
          )}
          {module.tasks_per_day && (
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <div className="text-lg font-bold text-white">~{module.tasks_per_day}</div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Tasks/Tag' : 'Tasks/Day'}
              </div>
            </div>
          )}
          {module.difficulty_level && (
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <div className={`text-lg font-bold ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Level' : 'Level'}
              </div>
            </div>
          )}
        </div>

        {/* Pillars covered */}
        {module.pillars && module.pillars.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              {language === 'de' ? 'Abgedeckte Bereiche' : 'Areas Covered'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {module.pillars.map(pillar => {
                const info = getPillarInfo(pillar);
                return (
                  <span
                    key={pillar}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-sm"
                  >
                    <span>{info.icon}</span>
                    <span className="text-white">{info.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* What to expect */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {language === 'de' ? 'Was dich erwartet' : 'What to Expect'}
          </h3>
          <div className="space-y-3">
            <ExpectationItem
              icon="📅"
              title={language === 'de' ? 'Tägliche Aufgaben' : 'Daily Tasks'}
              description={language === 'de'
                ? `Ca. ${module.tasks_per_day || 3} kleine Aufgaben pro Tag`
                : `About ${module.tasks_per_day || 3} small tasks per day`}
            />
            <ExpectationItem
              icon="⏱️"
              title={language === 'de' ? 'Zeitaufwand' : 'Time Commitment'}
              description={language === 'de'
                ? 'Weniger als 3 Minuten pro Aufgabe'
                : 'Less than 3 minutes per task'}
            />
            <ExpectationItem
              icon="📊"
              title={language === 'de' ? 'Fortschritt' : 'Progress'}
              description={language === 'de'
                ? 'Verfolge deinen Fortschritt in Echtzeit'
                : 'Track your progress in real-time'}
            />
            {module.duration_days && (
              <ExpectationItem
                icon="🎯"
                title={language === 'de' ? 'Ziel' : 'Goal'}
                description={language === 'de'
                  ? `Schließe alle ${module.duration_days} Tage ab`
                  : `Complete all ${module.duration_days} days`}
              />
            )}
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {language === 'de' ? 'Einstellungen' : 'Settings'}
          </h3>
          <div className="space-y-4">
            {/* Start date */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white">
                  {language === 'de' ? 'Startdatum' : 'Start Date'}
                </span>
                <p className="text-xs text-slate-500">
                  {language === 'de' ? 'Wann möchtest du starten?' : 'When do you want to start?'}
                </p>
              </div>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white">
                  {language === 'de' ? 'Erinnerungen' : 'Reminders'}
                </span>
                <p className="text-xs text-slate-500">
                  {language === 'de' ? 'Push-Benachrichtigungen erhalten' : 'Receive push notifications'}
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, notifications: !config.notifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.notifications ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    config.notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleActivate}
          disabled={activating || module.is_premium}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {activating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              {language === 'de' ? 'Wird aktiviert...' : 'Activating...'}
            </>
          ) : module.is_premium ? (
            <>
              <span>🔒</span>
              {language === 'de' ? 'PRO-Version erforderlich' : 'PRO Version Required'}
            </>
          ) : (
            <>
              <span>✨</span>
              {language === 'de' ? 'Modul aktivieren' : 'Activate Module'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Expectation Item Component
function ExpectationItem({ icon, title, description }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-slate-800/30">
      <span className="text-xl">{icon}</span>
      <div>
        <h4 className="text-white text-sm font-medium">{title}</h4>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
