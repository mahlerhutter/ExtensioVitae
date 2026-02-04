import React, { useState, useEffect } from 'react';
import {
  getRecommendedModules,
  getStarterBundle,
  quickActivateModule,
  getConvertiblePlan,
  convertPlanToModule
} from '../../lib/planModuleService';
import { getAvailableModules } from '../../lib/moduleService';
import { useToast } from '../Toast';
import ModuleConfigModal from './ModuleConfigModal';

/**
 * Module Activation Flow Component
 *
 * Onboarding flow for new users to activate their first modules.
 * Shows recommendations, starter bundle, and plan conversion option.
 */
export default function ModuleActivationFlow({
  userId,
  intakeData,
  language = 'de',
  onComplete,
  onSkip
}) {
  const [step, setStep] = useState('welcome'); // welcome | recommendations | configure | complete
  const [recommendations, setRecommendations] = useState([]);
  const [convertiblePlan, setConvertiblePlan] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [configModule, setConfigModule] = useState(null);
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const starterBundle = getStarterBundle();

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!userId) return;

      try {
        setLoading(true);

        const [recs, plan] = await Promise.all([
          getRecommendedModules(userId, intakeData),
          getConvertiblePlan(userId)
        ]);

        setRecommendations(recs);
        setConvertiblePlan(plan);
      } catch (error) {
        console.error('Error loading activation data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, intakeData]);

  // Handle module selection toggle
  const toggleModule = (moduleSlug) => {
    setSelectedModules(prev =>
      prev.includes(moduleSlug)
        ? prev.filter(s => s !== moduleSlug)
        : [...prev, moduleSlug]
    );
  };

  // Handle plan conversion
  const handleConvertPlan = async () => {
    if (!convertiblePlan) return;

    setActivating(true);
    try {
      const result = await convertPlanToModule(userId, convertiblePlan);
      if (result.success) {
        addToast(
          language === 'de'
            ? '✅ 30-Tage Plan als Modul aktiviert!'
            : '✅ 30-day plan activated as module!',
          'success'
        );
        setConvertiblePlan(null);
      } else {
        addToast(result.error, 'error');
      }
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  // Handle quick activation of selected modules
  const handleActivateSelected = async () => {
    if (selectedModules.length === 0) {
      setStep('complete');
      return;
    }

    setActivating(true);
    let successCount = 0;

    for (const slug of selectedModules) {
      try {
        // Find module to check if it needs config
        const module = recommendations.find(m => m.slug === slug) ||
                      starterBundle.find(b => b.slug === slug);

        // For now, quick activate with defaults
        const result = await quickActivateModule(userId, slug);
        if (result.success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error activating ${slug}:`, error);
      }
    }

    setActivating(false);

    if (successCount > 0) {
      addToast(
        language === 'de'
          ? `✅ ${successCount} Module aktiviert!`
          : `✅ ${successCount} modules activated!`,
        'success'
      );
    }

    setStep('complete');
  };

  // Handle module with config
  const handleConfigureAndActivate = async (module, config) => {
    setActivating(true);
    try {
      const result = await quickActivateModule(userId, module.slug, config);
      if (result.success) {
        addToast(
          language === 'de'
            ? `✅ ${module.name_de} aktiviert!`
            : `✅ ${module.name_en} activated!`,
          'success'
        );
        setSelectedModules(prev => prev.filter(s => s !== module.slug));
      } else {
        addToast(result.error, 'error');
      }
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setActivating(false);
      setConfigModule(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-slate-900 rounded-xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            {language === 'de' ? 'Lade Empfehlungen...' : 'Loading recommendations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Progress indicator */}
        <div className="flex gap-2 p-4 border-b border-slate-800">
          {['welcome', 'recommendations', 'complete'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ['welcome', 'recommendations', 'complete'].indexOf(step) >= i
                  ? 'bg-amber-500'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Step: Welcome */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-6xl mb-6">🧩</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {language === 'de' ? 'Willkommen bei den Modulen!' : 'Welcome to Modules!'}
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {language === 'de'
                  ? 'Module sind kleine Protokolle, die dir täglich helfen, deine Gesundheit zu optimieren. Wähle ein paar aus, um zu starten!'
                  : 'Modules are small protocols that help you optimize your health daily. Pick a few to get started!'}
              </p>

              {/* Convert existing plan option */}
              {convertiblePlan && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">
                        {language === 'de' ? 'Dein 30-Tage Plan' : 'Your 30-Day Plan'}
                      </h3>
                      <p className="text-sm text-slate-400 mb-3">
                        {language === 'de'
                          ? 'Du hast bereits einen aktiven Plan. Möchtest du ihn als Modul aktivieren?'
                          : 'You already have an active plan. Would you like to activate it as a module?'}
                      </p>
                      <button
                        onClick={handleConvertPlan}
                        disabled={activating}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {activating
                          ? (language === 'de' ? 'Aktiviere...' : 'Activating...')
                          : (language === 'de' ? 'Als Modul aktivieren' : 'Activate as module')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('recommendations')}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors"
              >
                {language === 'de' ? 'Module entdecken' : 'Discover modules'}
              </button>

              <button
                onClick={onSkip}
                className="block mx-auto mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                {language === 'de' ? 'Später einrichten' : 'Set up later'}
              </button>
            </div>
          )}

          {/* Step: Recommendations */}
          {step === 'recommendations' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {language === 'de' ? 'Empfohlene Module' : 'Recommended Modules'}
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                {language === 'de'
                  ? 'Basierend auf deinem Profil. Wähle mindestens 1-3 Module.'
                  : 'Based on your profile. Select at least 1-3 modules.'}
              </p>

              {/* Starter Bundle */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                  {language === 'de' ? 'Starter-Paket' : 'Starter Bundle'}
                </h3>
                <div className="space-y-2">
                  {starterBundle.map((item) => {
                    const isSelected = selectedModules.includes(item.slug);
                    return (
                      <button
                        key={item.slug}
                        onClick={() => toggleModule(item.slug)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{item.slug}</p>
                            <p className="text-sm text-slate-400">
                              {language === 'de' ? item.reason_de : item.reason_en}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personalized Recommendations */}
              {recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {language === 'de' ? 'Für dich empfohlen' : 'Recommended for you'}
                  </h3>
                  <div className="space-y-2">
                    {recommendations.slice(0, 3).map((module) => {
                      const isSelected = selectedModules.includes(module.slug);
                      return (
                        <button
                          key={module.slug}
                          onClick={() => toggleModule(module.slug)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500/50'
                              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{module.icon}</span>
                              <div>
                                <p className="font-medium text-white">
                                  {language === 'de' ? module.name_de : module.name_en}
                                </p>
                                <p className="text-sm text-slate-400">
                                  {module.reason
                                    ? (language === 'de' ? module.reason.de : module.reason.en)
                                    : (language === 'de' ? module.description_de : module.description_en)}
                                </p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('welcome')}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  {language === 'de' ? 'Zurück' : 'Back'}
                </button>
                <button
                  onClick={handleActivateSelected}
                  disabled={activating}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {activating
                    ? (language === 'de' ? 'Aktiviere...' : 'Activating...')
                    : selectedModules.length > 0
                      ? (language === 'de' ? `${selectedModules.length} Module aktivieren` : `Activate ${selectedModules.length} modules`)
                      : (language === 'de' ? 'Überspringen' : 'Skip')}
                </button>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {language === 'de' ? 'Alles eingerichtet!' : 'All set up!'}
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {language === 'de'
                  ? 'Deine Module sind aktiv. Du findest deine täglichen Aufgaben jetzt im Dashboard unter "Module".'
                  : 'Your modules are active. You can find your daily tasks in the dashboard under "Modules".'}
              </p>

              <button
                onClick={onComplete}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors"
              >
                {language === 'de' ? 'Zum Dashboard' : 'Go to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Config Modal */}
      {configModule && (
        <ModuleConfigModal
          module={configModule}
          language={language}
          onActivate={(config) => handleConfigureAndActivate(configModule, config)}
          onClose={() => setConfigModule(null)}
        />
      )}
    </div>
  );
}
