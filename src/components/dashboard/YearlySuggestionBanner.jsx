import React, { useState, useEffect } from 'react';
import { checkYearlySuggestion } from '../../lib/moduleService';

/**
 * Yearly Optimization Suggestion Banner
 *
 * Shows after a 30-day plan completes (or nears completion).
 * Offers upgrade to yearly-optimization module.
 */
export default function YearlySuggestionBanner({ userId, language = 'de', onActivate }) {
  const [suggestion, setSuggestion] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuggestion();
  }, [userId]);

  const checkSuggestion = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const result = await checkYearlySuggestion(userId);
      if (result) {
        // Check if previously dismissed (within last 7 days)
        const dismissedAt = localStorage.getItem(result.dismissKey);
        if (dismissedAt) {
          const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
          if (daysSinceDismiss < 7) {
            setLoading(false);
            return; // Still dismissed
          }
        }
        setSuggestion(result);
      }
    } catch (error) {
      console.error('Error checking yearly suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (suggestion?.dismissKey) {
      localStorage.setItem(suggestion.dismissKey, Date.now().toString());
    }
    setDismissed(true);
  };

  if (loading || !suggestion || dismissed) return null;

  const isCompleted = suggestion.reason === 'plan_completed';

  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Schließen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl flex-shrink-0">
            📅
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">
              {isCompleted
                ? 'Dein 30-Tage-Plan ist abgeschlossen!'
                : 'Dein 30-Tage-Plan endet bald!'
              }
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isCompleted
                ? 'Du hast das Fundament gelegt. Die Jahres-Optimierung hält deine Gewohnheiten am Leben und baut sie weiter aus — mit nur 3 Minuten pro Tag.'
                : 'Fast geschafft! Die Jahres-Optimierung ist der nächste Schritt — sie übernimmt deine Fortschritte und macht sie langfristig.'
              }
            </p>

            {/* Focus pillars from plan */}
            {suggestion.focusPillars?.length > 0 && (
              <p className="text-xs text-amber-400/70 mt-1.5">
                Deine Schwerpunkte werden übernommen
              </p>
            )}

            {/* CTA */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => onActivate?.()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 text-sm font-bold rounded-lg transition-all"
              >
                Vorschau ansehen
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
