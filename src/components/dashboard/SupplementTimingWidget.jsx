/**
 * Supplement Timing Widget
 *
 * Visualizes optimal supplement intake times based on circadian rhythm
 * Integrates with Biological Inventory (v0.8.0) and Supplement Timing Optimizer (BLOCK C)
 *
 * Design: Medical/Laboratory aesthetic with timeline visualization
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Utensils, Coffee, Moon, Sun } from 'lucide-react';
import {
    getOptimalTimings,
    groupSupplementsByTiming,
    checkTimingConflicts,
    formatSupplementTime,
    getSupplementDisplayName
} from '../../lib/supplementTiming';
import { getInventoryStatus } from '../../lib/inventoryService';
import { logger } from '../../lib/logger';

export default function SupplementTimingWidget({ userId, wakeTime = '07:00', activeProtocols = [] }) {
    const [timings, setTimings] = useState([]);
    const [groupedTimings, setGroupedTimings] = useState({});
    const [conflicts, setConflicts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (userId) {
            loadSupplementTimings();
        }
    }, [userId, wakeTime, activeProtocols]);

    const loadSupplementTimings = async () => {
        setLoading(true);
        try {
            // Get inventory to know which supplements user has
            const inventoryStatus = await getInventoryStatus(userId, activeProtocols);
            setInventory(inventoryStatus);

            // Get all supplements that have stock
            const supplements = inventoryStatus
                .filter(item => item.current_stock > 0)
                .map(item => item.supplement_slug);

            if (supplements.length === 0) {
                logger.info('[SupplementTiming] No supplements in inventory');
                setLoading(false);
                return;
            }

            // Calculate optimal timings
            const optimalTimings = getOptimalTimings(wakeTime, supplements);
            const grouped = groupSupplementsByTiming(optimalTimings);
            const potentialConflicts = checkTimingConflicts(optimalTimings);

            setTimings(optimalTimings);
            setGroupedTimings(grouped);
            setConflicts(potentialConflicts);

            logger.info('[SupplementTiming] Timings calculated:', optimalTimings.length);
        } catch (error) {
            logger.error('[SupplementTiming] Failed to load timings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeOfDayIcon = (timeOfDay) => {
        switch (timeOfDay) {
            case 'morning':
                return <Sun className="w-4 h-4 text-amber-400" />;
            case 'afternoon':
                return <Coffee className="w-4 h-4 text-orange-400" />;
            case 'evening':
                return <Moon className="w-4 h-4 text-purple-400" />;
            case 'bedtime':
                return <Moon className="w-4 h-4 text-indigo-400" />;
            default:
                return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    const getFoodIcon = (foodType) => {
        switch (foodType) {
            case 'high-fat':
                return '🥑';
            case 'any':
                return '🍽️';
            case 'empty-stomach':
                return '⏰';
            default:
                return '🍽️';
        }
    };

    const getStockStatus = (supplementSlug) => {
        const item = inventory.find(i => i.supplement_slug === supplementSlug);
        if (!item) return null;

        if (item.status === 'depleted') return { color: 'text-red-400', label: 'LEER' };
        if (item.status === 'critical') return { color: 'text-orange-400', label: `${item.days_remaining}d` };
        if (item.status === 'warning') return { color: 'text-yellow-400', label: `${item.days_remaining}d` };
        return { color: 'text-emerald-400', label: '✓' };
    };

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (timings.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-center py-6">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                        Keine Supplements im Inventar
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                        Füge Supplements hinzu, um optimale Einnahmezeiten zu sehen
                    </p>
                </div>
            </div>
        );
    }

    const timeCategories = [
        { key: 'morning', label: 'Morgens', icon: '☀️', color: 'border-amber-500/30 bg-amber-500/5' },
        { key: 'afternoon', label: 'Mittags', icon: '☕', color: 'border-orange-500/30 bg-orange-500/5' },
        { key: 'evening', label: 'Abends', icon: '🌙', color: 'border-purple-500/30 bg-purple-500/5' },
        { key: 'bedtime', label: 'Schlafenszeit', icon: '🛌', color: 'border-indigo-500/30 bg-indigo-500/5' }
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                                Supplement Timing Protocol
                            </h3>
                            <p className="text-slate-400 text-xs font-mono">
                                Optimiert basierend auf Wake Time: {wakeTime}
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

            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
                <div className="bg-orange-950/30 border-b border-orange-900/50 px-5 py-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-orange-400 text-sm font-medium">
                                {conflicts.length} Timing-Konflikt{conflicts.length > 1 ? 'e' : ''} erkannt
                            </p>
                            <p className="text-orange-400/70 text-xs mt-1">
                                Einige Supplements könnten sich gegenseitig beeinflussen
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline View */}
            <div className="p-5 space-y-4">
                {timeCategories.map(category => {
                    const categoryTimings = groupedTimings[category.key] || [];
                    if (categoryTimings.length === 0 && !expanded) return null;

                    return (
                        <div key={category.key} className={`border ${category.color} rounded-lg p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">{category.icon}</span>
                                <h4 className="text-white font-semibold text-sm">{category.label}</h4>
                                {categoryTimings.length > 0 && (
                                    <span className="text-slate-500 text-xs ml-auto">
                                        {categoryTimings.length} Supplement{categoryTimings.length > 1 ? 'e' : ''}
                                    </span>
                                )}
                            </div>

                            {categoryTimings.length > 0 ? (
                                <div className="space-y-3">
                                    {categoryTimings.map((timing, idx) => {
                                        const stockStatus = getStockStatus(timing.supplement);
                                        const hasConflict = conflicts.some(
                                            c => c.supplement1 === timing.supplement || c.supplement2 === timing.supplement
                                        );

                                        return (
                                            <div
                                                key={idx}
                                                className={`bg-slate-800/50 rounded-lg p-3 ${
                                                    hasConflict ? 'ring-1 ring-orange-500/50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h5 className="text-white font-medium text-sm">
                                                                {getSupplementDisplayName(timing.supplement)}
                                                            </h5>
                                                            {stockStatus && (
                                                                <span className={`text-xs ${stockStatus.color} font-mono`}>
                                                                    {stockStatus.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatSupplementTime(timing.time)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                {timing.withFood ? (
                                                                    <>
                                                                        <Utensils className="w-3 h-3" />
                                                                        Mit Essen {getFoodIcon(timing.foodType)}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        ⏰ Leerer Magen
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {expanded && (
                                                    <div className="mt-2 pt-2 border-t border-slate-700">
                                                        <p className="text-slate-400 text-xs leading-relaxed">
                                                            💡 {timing.reason}
                                                        </p>
                                                        {timing.interactions && timing.interactions.length > 0 && (
                                                            <p className="text-orange-400 text-xs mt-2">
                                                                ⚠️ Abstand halten zu: {timing.interactions.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-xs text-center py-2">
                                    Keine Supplements für diese Zeit
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* Conflict Details (Expanded) */}
                {expanded && conflicts.length > 0 && (
                    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-start gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <h4 className="text-orange-400 font-semibold text-sm">
                                Erkannte Timing-Konflikte
                            </h4>
                        </div>
                        <div className="space-y-2">
                            {conflicts.map((conflict, idx) => (
                                <div key={idx} className="text-xs">
                                    <p className="text-slate-300 mb-1">
                                        <span className="font-medium">{getSupplementDisplayName(conflict.supplement1)}</span>
                                        {' ↔ '}
                                        <span className="font-medium">{getSupplementDisplayName(conflict.supplement2)}</span>
                                    </p>
                                    <p className="text-slate-400">{conflict.reason}</p>
                                    <p className="text-orange-400 mt-1">→ {conflict.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scientific Note */}
                {expanded && (
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-cyan-400 text-lg">🧬</span>
                            <div>
                                <p className="text-cyan-400 font-semibold text-xs mb-1">
                                    Wissenschaftlicher Hintergrund
                                </p>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    Supplement-Timing basiert auf Pharmakokinetik und Chronobiologie.
                                    Fettlösliche Vitamine (D, A, E, K) brauchen Nahrungsfette zur Absorption.
                                    Magnesium als NMDA-Antagonist fördert abends den Schlaf.
                                    B-Vitamine morgens für ATP-Produktion und Energie.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
