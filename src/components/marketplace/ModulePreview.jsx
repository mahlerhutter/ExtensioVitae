import React, { useState, useEffect } from 'react';
import { generateYearlyPreview } from '../../lib/planModuleService';
import { getHealthProfile } from '../../lib/profileService';
import { getActiveUserModules } from '../../lib/moduleService';

/**
 * Module Preview Component
 *
 * Detailed view of a module before activation.
 * Special handling for yearly-optimization with rich quarterly preview.
 */
export default function ModulePreview({ module, userId, language = 'de', onActivate, onBack }) {
  const [config, setConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    notifications: true
  });
  const [activating, setActivating] = useState(false);

  // ─── Yearly Preview State ───
  const isYearlyModule = module?.slug === 'yearly-optimization';
  const [yearlyPreview, setYearlyPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [expandedQuarter, setExpandedQuarter] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | science | timeline
  const [activePlanName, setActivePlanName] = useState(null); // Track if 30-day plan active

  useEffect(() => {
    if (isYearlyModule) {
      loadYearlyPreview();
    }
  }, [isYearlyModule, userId]);

  const loadYearlyPreview = async () => {
    setLoadingPreview(true);
    try {
      let healthProfile = null;
      if (userId) {
        healthProfile = await getHealthProfile(userId);

        // Check if user has an active 30-day plan (for replacement messaging)
        try {
          const activeModules = await getActiveUserModules(userId);
          const planSlugs = ['30-day-longevity', 'longevity-kickstart'];
          const activePlan = activeModules?.find(
            inst => planSlugs.includes((inst.module || inst.definition)?.slug)
          );
          if (activePlan) {
            const def = activePlan.module || activePlan.definition;
            setActivePlanName(def?.name_de || '30-Tage-Plan');
          }
        } catch (e) {
          // Non-critical
        }
      }
      const preview = generateYearlyPreview(module, config, healthProfile);
      setYearlyPreview(preview);
    } catch (error) {
      console.error('Error generating yearly preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

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
      supplements: { de: 'Supplements', en: 'Supplements', icon: '💊' },
      // Extended pillars for yearly module
      sleep_recovery: { de: 'Schlaf & Recovery', en: 'Sleep & Recovery', icon: '😴' },
      circadian_rhythm: { de: 'Zirkadianischer Rhythmus', en: 'Circadian Rhythm', icon: '🌅' },
      mental_resilience: { de: 'Mentale Resilienz', en: 'Mental Resilience', icon: '🧠' },
      nutrition_metabolism: { de: 'Ernährung & Metabolismus', en: 'Nutrition & Metabolism', icon: '🥗' },
      movement_muscle: { de: 'Bewegung & Muskulatur', en: 'Movement & Muscle', icon: '💪' }
    };
    const info = pillars[pillar];
    return info ? { name: info[language], icon: info.icon } : { name: pillar, icon: '📋' };
  };

  const difficultyInfo = getDifficultyInfo(module.difficulty_level);

  // ═══════════════════════════════════════════════
  // YEARLY OPTIMIZATION: Rich Preview
  // ═══════════════════════════════════════════════
  if (isYearlyModule) {
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
            <span>Zurück</span>
          </button>

          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
              📅
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {yearlyPreview?.module_name || name}
              </h2>
              <p className="text-sm text-amber-400 mt-0.5">
                {yearlyPreview?.tagline_de || 'Dein persönliches Jahresprogramm'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {yearlyPreview?.duration_text_de || '365+ Tage kontinuierlich'}
              </p>
            </div>
          </div>

          {/* Active plan replacement notice */}
          {activePlanName && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-200">
                🔄 Dein aktiver <strong>{activePlanName}</strong> wird automatisch abgeschlossen und durch die Jahres-Optimierung ersetzt.
              </p>
            </div>
          )}

          {/* Personalized message */}
          {yearlyPreview?.personalized_message_de && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-200">
                ✨ {yearlyPreview.personalized_message_de}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 flex gap-1 border-b border-slate-700">
          {[
            { id: 'overview', label: 'Übersicht', icon: '📊' },
            { id: 'science', label: 'Wissenschaft', icon: '🔬' },
            { id: 'timeline', label: 'Timeline', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-b-2 border-amber-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-400">Jahres-Vorschau wird generiert...</span>
            </div>
          ) : yearlyPreview ? (
            <>
              {/* ─── TAB: Overview ─── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <div className="text-lg font-bold text-amber-400">{yearlyPreview.total_unique_tasks}</div>
                      <div className="text-xs text-slate-400">Tasks gesamt</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <div className="text-lg font-bold text-amber-400">4</div>
                      <div className="text-xs text-slate-400">Quartale</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <div className="text-lg font-bold text-green-400">{yearlyPreview.time_commitment?.percentage_of_year}%</div>
                      <div className="text-xs text-slate-400">deiner Zeit</div>
                    </div>
                  </div>

                  {/* Time Commitment */}
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Zeitaufwand</h3>
                    <div className="space-y-2">
                      <TimeRow emoji="☀️" label="Täglich" value={yearlyPreview.time_commitment?.daily_description_de} />
                      <TimeRow emoji="📋" label="Wöchentlich" value={yearlyPreview.time_commitment?.weekly_description_de} />
                      <TimeRow emoji="📊" label="Monatlich" value={yearlyPreview.time_commitment?.monthly_description_de} />
                      <TimeRow emoji="🔍" label="Quartalsweise" value={yearlyPreview.time_commitment?.quarterly_description_de} />
                      <TimeRow emoji="🎯" label="Jährlich" value={yearlyPreview.time_commitment?.yearly_description_de} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-amber-400">
                        {yearlyPreview.time_commitment?.commitment_level_de}
                      </p>
                    </div>
                  </div>

                  {/* Quarterly Breakdown */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Quartals-Übersicht</h3>
                    <div className="space-y-3">
                      {yearlyPreview.quarterly_breakdown?.map((q, idx) => (
                        <QuarterCard
                          key={q.quarter}
                          quarter={q}
                          index={idx}
                          isExpanded={expandedQuarter === q.quarter}
                          onToggle={() => setExpandedQuarter(expandedQuarter === q.quarter ? null : q.quarter)}
                          getPillarInfo={getPillarInfo}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Health Adjustments */}
                  {yearlyPreview.health_adjustments?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-3">
                        Personalisierte Anpassungen
                      </h3>
                      <div className="space-y-2">
                        {yearlyPreview.health_adjustments.map((adj, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                            <span className="text-amber-400 text-lg">⚡</span>
                            <div>
                              <p className="text-sm text-white">{adj.adjustment_de}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Betrifft: {adj.quarters.join(', ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: Science ─── */}
              {activeTab === 'science' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-4">
                      {yearlyPreview.science_overview?.methodology_de}
                    </h3>
                    <div className="space-y-4">
                      {yearlyPreview.science_overview?.pillars?.map((pillar, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                          <h4 className="text-sm font-medium text-amber-400">{pillar.name_de}</h4>
                          <p className="text-xs text-slate-400 mt-1">{pillar.description_de}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quarterly Biology */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Saisonale Biologie</h3>
                    <div className="space-y-3">
                      {yearlyPreview.quarterly_breakdown?.map((q) => (
                        <div key={q.quarter} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                              {q.quarter}
                            </span>
                            <span className="text-sm text-white">{q.months_de}</span>
                          </div>
                          <p className="text-xs text-slate-400">{q.biology_de}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pillar Emphasis */}
                  {yearlyPreview.pillar_emphasis && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-3">Deine Pillar-Gewichtung</h3>
                      <div className="space-y-2">
                        {Object.entries(yearlyPreview.pillar_emphasis).map(([key, pillar]) => (
                          <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                            <span className="text-lg">{getPillarInfo(key).icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white truncate">{pillar.name_de}</span>
                                {pillar.is_focus_area && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Fokus</span>
                                )}
                              </div>
                              <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                                  style={{ width: `${pillar.need_score}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right">{pillar.need_score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: Timeline ─── */}
              {activeTab === 'timeline' && (
                <div className="space-y-1">
                  {yearlyPreview.science_overview?.time_to_results_de?.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {/* Line */}
                      {i < (yearlyPreview.science_overview?.time_to_results_de?.length || 0) - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-700" />
                      )}
                      {/* Dot */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold z-10 ${
                        i === 0 ? 'bg-amber-500 text-slate-900' :
                        i < 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                      {/* Content */}
                      <div className="py-1 pb-6">
                        <p className="text-sm font-medium text-white">{step.period}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Vorschau konnte nicht geladen werden</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleActivate}
            disabled={activating || module.is_premium}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {activating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Wird aktiviert...
              </>
            ) : module.is_premium ? (
              <>
                <span>🔒</span>
                PRO-Version erforderlich
              </>
            ) : (
              <>
                <span>📅</span>
                Jahres-Optimierung starten
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            Nur {yearlyPreview?.time_commitment?.daily_minutes || 3} Minuten pro Tag
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // DEFAULT: Generic Module Preview (unchanged)
  // ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════

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

// Time commitment row
function TimeRow({ emoji, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1">
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <p className="text-xs text-slate-500">{value}</p>
      </div>
    </div>
  );
}

// Quarter card with expandable detail
function QuarterCard({ quarter, index, isExpanded, onToggle, getPillarInfo }) {
  const intensityColors = {
    'moderat': 'text-green-400 bg-green-500/10',
    'hoch': 'text-yellow-400 bg-yellow-500/10',
    'sehr hoch': 'text-orange-400 bg-orange-500/10',
    'moderat-niedrig': 'text-blue-400 bg-blue-500/10'
  };

  const quarterColors = [
    'border-l-blue-400',
    'border-l-green-400',
    'border-l-orange-400',
    'border-l-purple-400'
  ];

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-xl bg-slate-800/30 border border-slate-700 border-l-4 ${quarterColors[index]} transition-all hover:bg-slate-800/50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">{quarter.name_de}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${intensityColors[quarter.intensity] || 'text-slate-400 bg-slate-700'}`}>
              {quarter.intensity}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{quarter.months_de}</p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Pillar pills (always visible) */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {quarter.priority_pillars?.map(pillar => {
          const info = getPillarInfo(pillar);
          return (
            <span key={pillar} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-xs text-slate-300">
              <span>{info.icon}</span>
              {info.name}
            </span>
          );
        })}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
          <p className="text-xs text-slate-300">{quarter.theme_de}</p>
          <p className="text-xs text-slate-500 italic">{quarter.biology_de}</p>
          <div className="flex gap-1.5 mt-1">
            <span className="text-xs text-slate-500">Saisonale Tasks:</span>
            {quarter.seasonal_tasks?.map(task => (
              <span key={task} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                {task}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
