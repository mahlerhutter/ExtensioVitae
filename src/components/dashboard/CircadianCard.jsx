/**
 * Circadian Card (BLOCK B)
 *
 * Dashboard card displaying personalized circadian light recommendations
 * Based on user wake time and scientific sleep/light principles
 *
 * Design: Glassmorphism aesthetic matching existing dashboard cards
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Lightbulb, Clock, AlertCircle } from 'lucide-react';
import {
    getCircadianRecommendations,
    getCurrentCircadianPhase,
    formatTime
} from '../../lib/circadianService';
import { logger } from '../../lib/logger';

export default function CircadianCard({ userProfile = {} }) {
    const [recommendations, setRecommendations] = useState([]);
    const [currentPhase, setCurrentPhase] = useState(null);
    const [expanded, setExpanded] = useState(false);

    // Get wake time from user profile (default 7:00 AM)
    const wakeTime = userProfile?.wake_time || '07:00';

    useEffect(() => {
        try {
            const recs = getCircadianRecommendations(wakeTime);
            const phase = getCurrentCircadianPhase(wakeTime);

            setRecommendations(recs);
            setCurrentPhase(phase);

            logger.info('[CircadianCard] Recommendations loaded:', recs.length);
        } catch (error) {
            logger.error('[CircadianCard] Failed to load recommendations:', error);
        }
    }, [wakeTime]);

    const getPhaseIcon = (type) => {
        switch (type) {
            case 'morning':
                return <Sun className="w-5 h-5 text-amber-400" />;
            case 'evening':
                return <Moon className="w-5 h-5 text-purple-400" />;
            case 'midday':
                return <Lightbulb className="w-5 h-5 text-cyan-400" />;
            default:
                return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical':
                return 'border-red-500/50 bg-red-500/10';
            case 'high':
                return 'border-amber-500/50 bg-amber-500/10';
            case 'medium':
                return 'border-cyan-500/50 bg-cyan-500/10';
            default:
                return 'border-slate-700 bg-slate-800/30';
        }
    };

    const getPriorityTextColor = (priority) => {
        switch (priority) {
            case 'critical':
                return 'text-red-400';
            case 'high':
                return 'text-amber-400';
            case 'medium':
                return 'text-cyan-400';
            default:
                return 'text-slate-400';
        }
    };

    if (!recommendations.length) {
        return null;
    }

    // Get high-priority active recommendation for quick view
    const activeRec = recommendations.find(r => r.isActive && (r.priority === 'high' || r.priority === 'critical'));

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                            {currentPhase?.icon || '💡'}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                                Circadian Light Protocol
                            </h3>
                            <p className="text-slate-400 text-xs">
                                {currentPhase?.label || 'Baseline Phase'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Quick View - Active Recommendation */}
            {activeRec && !expanded && (
                <div className="p-5">
                    <div className={`border ${getPriorityColor(activeRec.priority)} rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                            {getPhaseIcon(activeRec.window.type)}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold text-sm ${getPriorityTextColor(activeRec.priority)}`}>
                                        JETZT AKTIV
                                    </h4>
                                    {currentPhase?.timeRemaining && (
                                        <span className="text-xs text-slate-400">
                                            noch {currentPhase.timeRemaining} Min
                                        </span>
                                    )}
                                </div>
                                <p className="text-white text-sm font-medium mb-2">
                                    {activeRec.window.type === 'morning'
                                        ? `☀️ Hole dir ${activeRec.duration} Min Sonnenlicht`
                                        : activeRec.window.type === 'evening'
                                            ? `🌙 Vermeide blaues Licht bis zum Schlafengehen`
                                            : `💡 Kurze Lichtexposition für Wachheit`}
                                </p>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    {formatTime(activeRec.window.start)} - {formatTime(activeRec.window.end)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded View - All Recommendations */}
            {expanded && (
                <div className="p-5 space-y-3">
                    {recommendations
                        .sort((a, b) => {
                            // Sort by priority and time
                            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                        })
                        .map((rec, idx) => (
                            <div
                                key={idx}
                                className={`border ${getPriorityColor(rec.priority)} rounded-lg p-4 ${
                                    rec.isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    {getPhaseIcon(rec.window.type)}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-white font-medium text-sm">
                                                {rec.window.label}
                                            </h4>
                                            {rec.isActive && (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                                                    AKTIV
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-xs mb-2">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {formatTime(rec.window.start)} - {formatTime(rec.window.end)}
                                            {rec.duration && ` (${rec.duration} Min)`}
                                        </p>
                                    </div>
                                </div>

                                {/* Recommendation Details */}
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className="text-slate-500 font-medium min-w-[70px]">Intensität:</span>
                                        <span className="text-slate-300">{rec.intensity}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-slate-500 font-medium min-w-[70px]">Grund:</span>
                                        <span className="text-slate-300 leading-relaxed">{rec.reason}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {/* Scientific Note */}
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-cyan-400 font-semibold text-xs mb-1">
                                    Wissenschaftlicher Kontext
                                </p>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    Lichtexposition ist der stärkste Zeitgeber für deinen Circadian Rhythmus.
                                    Morgenlicht (10,000 lux) verschiebt die biologische Uhr nach vorne,
                                    während blaues Licht am Abend Melatonin unterdrückt und den Schlaf verzögert.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
