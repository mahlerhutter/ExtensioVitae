import React from 'react';
import { Upload, Activity, Watch, FlaskConical, Calendar, Package } from 'lucide-react';

/**
 * Universal Empty State Component
 *
 * Shows helpful empty states instead of "No data"
 * Each type has:
 * - Icon
 * - Title
 * - Description
 * - CTA button
 */

const EMPTY_STATE_CONFIGS = {
    labResults: {
        icon: FlaskConical,
        iconColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        title: 'Keine Laborergebnisse',
        description: 'Lade deine Blutwerte hoch um personalisierte Biomarker-Insights zu erhalten.',
        ctaText: 'Lab Upload starten',
        ctaLink: '/labs'
    },
    wearable: {
        icon: Watch,
        iconColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        title: 'Kein Wearable verbunden',
        description: 'Verbinde Oura Ring oder WHOOP für automatisches HRV-Tracking und Recovery-Scores.',
        ctaText: 'Wearable verbinden',
        ctaLink: '/health-profile'
    },
    recovery: {
        icon: Activity,
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        title: 'Noch keine Recovery-Daten',
        description: 'Starte heute mit deinem Morning Check-in (30 Sek) um deinen ersten Recovery Score zu erhalten.',
        ctaText: 'Check-in starten',
        ctaLink: null, // Will trigger callback
        ctaCallback: true
    },
    calendar: {
        icon: Calendar,
        iconColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        title: 'Kalender nicht verbunden',
        description: 'Verbinde deinen Kalender für automatische Jet-Lag- und Focus-Block-Erkennung.',
        ctaText: 'Kalender verbinden',
        ctaLink: null,
        ctaCallback: true
    },
    supplements: {
        icon: Package,
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        title: 'Kein Supplement-Inventar',
        description: 'Füge deine Supplements hinzu um Smart-Refill-Reminders und Timing-Optimierungen zu erhalten.',
        ctaText: 'Supplements hinzufügen',
        ctaLink: '/health-profile'
    },
    tasks: {
        icon: Upload,
        iconColor: 'text-slate-400',
        bgColor: 'bg-slate-800/50',
        borderColor: 'border-slate-700',
        title: 'Keine Tasks für diesen Zeitblock',
        description: 'Du bist im Active Recovery Modus. Deine nächsten Tasks kommen später.',
        ctaText: null,
        ctaLink: null
    }
};

export default function EmptyState({
    type,
    onCtaClick,
    customIcon,
    customTitle,
    customDescription,
    customCtaText,
    compact = false
}) {
    const config = EMPTY_STATE_CONFIGS[type] || EMPTY_STATE_CONFIGS.tasks;
    const Icon = customIcon || config.icon;

    const handleClick = () => {
        if (config.ctaCallback && onCtaClick) {
            onCtaClick();
        } else if (config.ctaLink) {
            window.location.href = config.ctaLink;
        }
    };

    if (compact) {
        return (
            <div className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium mb-1">
                            {customTitle || config.title}
                        </p>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            {customDescription || config.description}
                        </p>
                        {(customCtaText || config.ctaText) && (
                            <button
                                onClick={handleClick}
                                className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {customCtaText || config.ctaText} →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`border ${config.borderColor} ${config.bgColor} rounded-xl p-8 text-center`}>
            <div className="flex justify-center mb-4">
                <div className={`${config.bgColor} border ${config.borderColor} rounded-full p-4`}>
                    <Icon className={`w-8 h-8 ${config.iconColor}`} />
                </div>
            </div>

            <h3 className="text-white text-lg font-semibold mb-2">
                {customTitle || config.title}
            </h3>

            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                {customDescription || config.description}
            </p>

            {(customCtaText || config.ctaText) && (
                <button
                    onClick={handleClick}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                    {customCtaText || config.ctaText}
                </button>
            )}
        </div>
    );
}

// Export type constants for easy use
export const EMPTY_STATE_TYPES = {
    LAB_RESULTS: 'labResults',
    WEARABLE: 'wearable',
    RECOVERY: 'recovery',
    CALENDAR: 'calendar',
    SUPPLEMENTS: 'supplements',
    TASKS: 'tasks'
};
