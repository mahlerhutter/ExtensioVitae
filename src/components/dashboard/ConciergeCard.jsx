/**
 * Concierge Card (v0.7.0)
 *
 * "Priority Inbox" for predictive protocol suggestions
 * Family Office aesthetic - Gold/Navy palette
 *
 * Shows proactive suggestions from Predictive Context Engine
 * "Execution over Education" (AX-3) - The app manages, user approves
 */

import React, { useState } from 'react';
import { autoActivateProtocol } from '../../lib/predictiveService';
import { checkProtocolFulfillment } from '../../lib/inventoryService';
import { logger } from '../../lib/logger';

export default function ConciergeCard({ predictions, userId, onActivate, onDismiss }) {
    const [activating, setActivating] = useState(null);
    const [inventoryWarning, setInventoryWarning] = useState(null);

    if (!predictions || predictions.length === 0) {
        return null;
    }

    // Show only the highest priority prediction
    const topPrediction = predictions[0];

    const handleActivate = async (prediction) => {
        setActivating(prediction.id);
        setInventoryWarning(null);

        try {
            // STEP 1: Check Biological Inventory (v0.8.0)
            const fulfillment = await checkProtocolFulfillment(userId, prediction.protocolId);

            if (!fulfillment.fulfilled) {
                // Protocol cannot be activated - missing critical supplies
                setInventoryWarning({
                    type: 'critical',
                    missing: fulfillment.missing,
                    warnings: fulfillment.warnings
                });
                setActivating(null);
                return;
            }

            if (fulfillment.warnings.length > 0) {
                // Low stock warning - but can still activate
                setInventoryWarning({
                    type: 'warning',
                    warnings: fulfillment.warnings
                });
            }

            // STEP 2: Activate protocol
            const result = await autoActivateProtocol(prediction, userId);

            if (result.success) {
                logger.info('[ConciergeCard] Protocol activated:', result.protocol.title);
                onActivate?.(prediction, result);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            logger.error('[ConciergeCard] Failed to activate:', error);
        } finally {
            setActivating(null);
        }
    };

    const handleDismiss = (prediction) => {
        onDismiss?.(prediction);
    };

    return (
        <div className="relative mb-6 animate-in fade-in slide-in-from-top duration-500">
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 rounded-2xl blur-xl animate-pulse-slow" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
                {/* Top Bar - Gold Accent */}
                <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-shimmer" />

                {/* Content */}
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">
                                    {topPrediction.type === 'flight' && '✈️'}
                                    {topPrediction.type === 'deep_work' && '🧠'}
                                    {topPrediction.type === 'late_night' && '🌙'}
                                </span>
                            </div>

                            {/* Title & Message */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                                        Family Office Briefing
                                    </h3>
                                    <PriorityBadge priority={topPrediction.priority} />
                                </div>
                                <p className="text-white font-medium text-base leading-tight mb-2">
                                    {topPrediction.reason}
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {getBriefingMessage(topPrediction)}
                                </p>
                            </div>
                        </div>

                        {/* Dismiss Button */}
                        <button
                            onClick={() => handleDismiss(topPrediction)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
                            title="Dismiss"
                        >
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Bio-Fulfillment Warning */}
                    {!topPrediction.fulfillment?.fulfilled && (
                        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-orange-400 text-lg flex-shrink-0">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-orange-400 font-semibold text-xs mb-1">
                                        Supply Check
                                    </p>
                                    <p className="text-slate-300 text-xs leading-tight">
                                        {topPrediction.fulfillment?.message}
                                    </p>
                                    {topPrediction.fulfillment?.missing && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {topPrediction.fulfillment.missing.map(item => (
                                                <span
                                                    key={item}
                                                    className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-[10px] text-orange-300 font-medium"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventory Warning (v0.8.0) */}
                    {inventoryWarning && (
                        <div className={`mb-4 p-3 rounded-lg border ${
                            inventoryWarning.type === 'critical'
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                            <div className="flex items-start gap-2">
                                <span className={`text-lg flex-shrink-0 ${
                                    inventoryWarning.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                    {inventoryWarning.type === 'critical' ? '🚨' : '⚠️'}
                                </span>
                                <div className="flex-1">
                                    <p className={`font-semibold text-xs mb-1 ${
                                        inventoryWarning.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                        {inventoryWarning.type === 'critical'
                                            ? 'Kritische Versorgungslücke'
                                            : 'Niedriger Lagerbestand'}
                                    </p>
                                    {inventoryWarning.type === 'critical' ? (
                                        <>
                                            <p className="text-slate-300 text-xs leading-tight mb-2">
                                                Protokoll kann nicht aktiviert werden. Fehlende Supplements:
                                            </p>
                                            <div className="space-y-1">
                                                {inventoryWarning.missing.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className="text-red-400">•</span>
                                                        <span className="text-slate-300">
                                                            {item.supplement}: {item.needed} {item.unit} benötigt
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-slate-400 text-xs mt-2">
                                                Bitte Supplements nachbestellen bevor du das Protokoll aktivierst.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-slate-300 text-xs leading-tight mb-2">
                                                Protokoll-Effektivität gefährdet. Niedrige Bestände:
                                            </p>
                                            <div className="space-y-1">
                                                {inventoryWarning.warnings.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className="text-yellow-400">•</span>
                                                        <span className="text-slate-300">
                                                            {item.supplement}: nur noch {item.days_remaining} Tage ({item.current_stock} verfügbar)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {topPrediction.action === 'activate' ? (
                            <>
                                <button
                                    onClick={() => handleActivate(topPrediction)}
                                    disabled={activating === topPrediction.id || inventoryWarning?.type === 'critical'}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {activating === topPrediction.id ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                            <span>Aktiviere...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Protokoll aktivieren</span>
                                            <span className="text-lg">→</span>
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleActivate(topPrediction)}
                                    disabled={activating === topPrediction.id}
                                    className="flex-1 py-3 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {activating === topPrediction.id ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                            <span>Aktiviere...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Aktivieren</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDismiss(topPrediction)}
                                    className="flex-1 py-3 px-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 font-medium rounded-xl transition-all"
                                >
                                    Später
                                </button>
                            </>
                        )}
                    </div>

                    {/* Footer Meta */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <span>Predictive Intelligence aktiv</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-600">Confidence:</span>
                            <span className="text-amber-400 font-semibold uppercase">
                                {topPrediction.confidence}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }) {
    const styles = {
        critical: 'bg-red-500/20 border-red-500/40 text-red-400',
        high: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
        medium: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
        low: 'bg-slate-500/20 border-slate-500/40 text-slate-400'
    };

    return (
        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${styles[priority] || styles.medium}`}>
            {priority}
        </span>
    );
}

/**
 * Get briefing message based on prediction type
 */
function getBriefingMessage(prediction) {
    const messages = {
        flight: 'Das Jet-Lag-Protokoll startet automatisch mit optimiertem Licht-Exposition-Timing und Melatonin-Shift für schnelle Anpassung.',
        deep_work: 'Dein Flow State Stack ist bereit: Phone Jail aktiviert, Notification-Sperre läuft, optimales Nootropika-Timing.',
        late_night: 'Sleep Guard wird aktiviert: Verstärkter Blaulicht-Filter + Melatonin-Boost sichern deine Regeneration.'
    };

    return messages[prediction.type] || 'Die App übernimmt das Management für dich.';
}

// Custom animations
const animationStyles = `
    @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }

    .animate-shimmer {
        background-size: 200% 100%;
        animation: shimmer 3s linear infinite;
    }

    .animate-pulse-slow {
        animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('concierge-card-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'concierge-card-styles';
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
}
