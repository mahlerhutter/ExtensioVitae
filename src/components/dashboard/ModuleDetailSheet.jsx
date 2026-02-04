import React, { useState } from 'react';
import { MODULE_SCIENCE_DATA } from '../../lib/moduleScienceData';

/**
 * Module Detail Sheet Component
 *
 * Full-screen bottom sheet with comprehensive module information:
 * - How it works (mechanism)
 * - Expected outcomes timeline
 * - Pillar contributions
 * - Scientific evidence with citations
 */
export default function ModuleDetailSheet({ module, tasks, language = 'de', onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Support both 'definition' and 'module' property names for backwards compatibility
  const definition = module.definition || module.module;

  // Ensure we have valid numbers
  const current_day = module.current_day || 1;
  const total_days = module.total_days || definition?.duration_days || 30;
  const completion_rate = module.completion_rate || 0;

  const name = language === 'de'
    ? (definition?.name_de || definition?.name || 'Modul')
    : (definition?.name_en || definition?.name_de || definition?.name || 'Module');
  const description = language === 'de'
    ? (definition?.description_de || definition?.description || '')
    : (definition?.description_en || definition?.description_de || definition?.description || '');

  // Get science data for this module type (try slug first, then module_type)
  const moduleType = definition?.slug || definition?.module_type;
  const scienceData = MODULE_SCIENCE_DATA[moduleType] || MODULE_SCIENCE_DATA.default;

  const progressPercent = total_days > 0 ? Math.min((current_day / total_days) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative mt-auto max-h-[90vh] bg-slate-900 rounded-t-3xl overflow-hidden animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
              {definition?.icon || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4 p-4 rounded-xl bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                {language === 'de' ? `Tag ${current_day} von ${total_days}` : `Day ${current_day} of ${total_days}`}
              </span>
              <span className="text-sm font-medium text-amber-400">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6">
          {[
            { id: 'overview', label: language === 'de' ? 'Übersicht' : 'Overview' },
            { id: 'how', label: language === 'de' ? 'Wie es wirkt' : 'How it works' },
            { id: 'outcomes', label: language === 'de' ? 'Ergebnisse' : 'Outcomes' },
            { id: 'science', label: language === 'de' ? 'Wissenschaft' : 'Science' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-amber-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
          {activeTab === 'overview' && (
            <OverviewTab
              module={module}
              tasks={tasks}
              scienceData={scienceData}
              language={language}
            />
          )}
          {activeTab === 'how' && (
            <HowItWorksTab scienceData={scienceData} language={language} />
          )}
          {activeTab === 'outcomes' && (
            <OutcomesTab
              module={module}
              scienceData={scienceData}
              language={language}
            />
          )}
          {activeTab === 'science' && (
            <ScienceTab scienceData={scienceData} language={language} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ module, tasks, scienceData, language }) {
  // Support both 'definition' and 'module' property names
  const definition = module.definition || module.module;
  const pillars = definition?.pillars || [];
  const todayComplete = tasks?.filter(t => t.completed).length || 0;
  const todayTotal = tasks?.length || 0;

  // Ensure valid numbers
  const current_day = module.current_day || 1;
  const total_days = module.total_days || definition?.duration_days || 30;
  const daysRemaining = Math.max(0, total_days - current_day);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={todayComplete}
          label={language === 'de' ? 'Heute erledigt' : 'Done today'}
          subValue={`/${todayTotal}`}
          icon="✓"
        />
        <StatCard
          value={Math.round(module.completion_rate || 0)}
          label={language === 'de' ? 'Erfolgsrate' : 'Success rate'}
          subValue="%"
          icon="📊"
        />
        <StatCard
          value={daysRemaining}
          label={language === 'de' ? 'Tage übrig' : 'Days left'}
          icon="📅"
        />
      </div>

      {/* Pillars affected */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">
          {language === 'de' ? 'Beeinflusste Säulen' : 'Pillars Affected'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {pillars.map(pillar => {
            const config = PILLAR_CONFIG[pillar];
            return (
              <div
                key={pillar}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config?.bg || 'bg-slate-800'}`}
              >
                <span className="text-lg">{config?.icon || '📋'}</span>
                <span className={`text-sm ${config?.text || 'text-slate-400'}`}>
                  {config?.[language] || pillar}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key benefits preview */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">
          {language === 'de' ? 'Wichtigste Vorteile' : 'Key Benefits'}
        </h3>
        <div className="space-y-2">
          {(scienceData?.benefits || []).slice(0, 3).map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <span className="text-green-400 mt-0.5">✓</span>
              <span className="text-sm text-slate-300">
                {language === 'de' ? benefit.de : benefit.en}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// How It Works Tab
function HowItWorksTab({ scienceData, language }) {
  const mechanism = scienceData?.mechanism || {};

  return (
    <div className="space-y-6">
      {/* Main explanation */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <h3 className="text-white font-medium mb-2">
          {language === 'de' ? 'Das Prinzip' : 'The Principle'}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {language === 'de' ? mechanism.principle_de : mechanism.principle_en}
        </p>
      </div>

      {/* Step by step */}
      {mechanism.steps && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {language === 'de' ? 'So funktioniert es' : 'How it works'}
          </h3>
          <div className="space-y-3">
            {mechanism.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-sm font-medium">{i + 1}</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-slate-300">
                    {language === 'de' ? step.de : step.en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biological pathways */}
      {mechanism.pathways && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {language === 'de' ? 'Biologische Mechanismen' : 'Biological Pathways'}
          </h3>
          <div className="space-y-2">
            {mechanism.pathways.map((pathway, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{pathway.icon}</span>
                  <span className="text-sm font-medium text-white">
                    {language === 'de' ? pathway.name_de : pathway.name_en}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'de' ? pathway.description_de : pathway.description_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Outcomes Tab
function OutcomesTab({ module, scienceData, language }) {
  const timeline = scienceData?.timeline || [];
  const currentDay = module.current_day || 0;

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-4">
          {language === 'de' ? 'Was du erwarten kannst' : 'What to expect'}
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-8 bottom-4 w-0.5 bg-slate-700" />

          <div className="space-y-4">
            {timeline.map((phase, i) => {
              const isPast = currentDay >= phase.day_start;
              const isCurrent = currentDay >= phase.day_start && currentDay < (timeline[i + 1]?.day_start || Infinity);

              return (
                <div key={i} className="relative flex gap-4">
                  {/* Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    isCurrent
                      ? 'bg-amber-500 ring-4 ring-amber-500/20'
                      : isPast
                        ? 'bg-green-500'
                        : 'bg-slate-700'
                  }`}>
                    {isPast && !isCurrent ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs text-white font-medium">{phase.day_start}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${isCurrent ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-40'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {language === 'de' ? phase.title_de : phase.title_en}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                          {language === 'de' ? 'Jetzt' : 'Now'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {language === 'de' ? phase.description_de : phase.description_en}
                    </p>
                    {phase.markers && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phase.markers.map((marker, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {language === 'de' ? marker.de : marker.en}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Long-term impact */}
      {scienceData?.longTermImpact && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
          <h3 className="text-green-400 font-medium mb-2 flex items-center gap-2">
            <span>🌱</span>
            {language === 'de' ? 'Langzeit-Wirkung' : 'Long-term Impact'}
          </h3>
          <p className="text-sm text-slate-300">
            {language === 'de' ? scienceData.longTermImpact.de : scienceData.longTermImpact.en}
          </p>
        </div>
      )}
    </div>
  );
}

// Science Tab
function ScienceTab({ scienceData, language }) {
  const studies = scienceData?.studies || [];
  const evidenceLevel = scienceData?.evidenceLevel || 'moderate';

  const evidenceLevels = {
    strong: { de: 'Starke Evidenz', en: 'Strong Evidence', color: 'text-green-400', bg: 'bg-green-500/20' },
    moderate: { de: 'Moderate Evidenz', en: 'Moderate Evidence', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    emerging: { de: 'Aufkommende Evidenz', en: 'Emerging Evidence', color: 'text-orange-400', bg: 'bg-orange-500/20' }
  };

  const level = evidenceLevels[evidenceLevel] || evidenceLevels.moderate;

  return (
    <div className="space-y-6">
      {/* Evidence level badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${level.bg}`}>
        <span className="text-lg">🔬</span>
        <span className={`text-sm font-medium ${level.color}`}>
          {language === 'de' ? level.de : level.en}
        </span>
      </div>

      {/* Summary */}
      {scienceData?.scientificSummary && (
        <div className="p-4 rounded-xl bg-slate-800/50">
          <p className="text-sm text-slate-300 leading-relaxed">
            {language === 'de' ? scienceData.scientificSummary.de : scienceData.scientificSummary.en}
          </p>
        </div>
      )}

      {/* Studies */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">
          {language === 'de' ? 'Referenzierte Studien' : 'Referenced Studies'}
        </h3>
        <div className="space-y-3">
          {studies.map((study, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-medium text-white mb-1">{study.title}</h4>
              <p className="text-xs text-slate-500 mb-2">
                {study.authors} • {study.journal} • {study.year}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'de' ? study.finding_de : study.finding_en}
              </p>
              {study.doi && (
                <a
                  href={`https://doi.org/${study.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:underline"
                >
                  <span>DOI: {study.doi}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key biomarkers */}
      {scienceData?.biomarkers && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {language === 'de' ? 'Messbare Biomarker' : 'Measurable Biomarkers'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {scienceData.biomarkers.map((marker, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/30 text-center">
                <span className="text-2xl">{marker.icon}</span>
                <p className="text-xs text-white mt-1">{marker.name}</p>
                <p className="text-xs text-green-400">{marker.direction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ value, label, subValue, icon }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/50 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-white">
        {value}{subValue && <span className="text-sm text-slate-400">{subValue}</span>}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// Pillar configuration
const PILLAR_CONFIG = {
  sleep: { de: 'Schlaf', en: 'Sleep', icon: '😴', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  nutrition: { de: 'Ernährung', en: 'Nutrition', icon: '🥗', bg: 'bg-green-500/20', text: 'text-green-400' },
  exercise: { de: 'Bewegung', en: 'Exercise', icon: '🏃', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  stress: { de: 'Stress', en: 'Stress', icon: '🧘', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  mindfulness: { de: 'Achtsamkeit', en: 'Mindfulness', icon: '🧠', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  supplements: { de: 'Supplements', en: 'Supplements', icon: '💊', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  connection: { de: 'Verbindung', en: 'Connection', icon: '👥', bg: 'bg-pink-500/20', text: 'text-pink-400' },
  environment: { de: 'Umwelt', en: 'Environment', icon: '🌿', bg: 'bg-teal-500/20', text: 'text-teal-400' }
};
