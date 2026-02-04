/**
 * Morning Bio-Check Overlay (v0.6.0)
 *
 * 5-Second Subjective Bio-Check System
 * Replaces wearable data with rapid self-assessment
 *
 * Design: Glasmorphism, "Spaceship System-Check" aesthetic
 * Philosophy: The body knows. We just need to ask.
 */

import React, { useState } from 'react';
import { recordManualReadiness } from '../../lib/readinessService';
import { logger } from '../../lib/logger';

export default function MorningBioCheckOverlay({ userId, onComplete, onSkip }) {
    const [sleepQuality, setSleepQuality] = useState(7);
    const [mentalEnergy, setMentalEnergy] = useState(7);
    const [physicalReadiness, setPhysicalReadiness] = useState(7);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            // Map to readinessService format (energy, mood, soreness)
            // We use the existing recordManualReadiness but map our values
            const result = await recordManualReadiness(userId, {
                energy: mentalEnergy,
                mood: (sleepQuality + mentalEnergy) / 2, // Derived from sleep + mental
                soreness: 10 - physicalReadiness // Invert physical readiness to soreness
            });

            if (result.success) {
                logger.info('[BioCheck] Morning check-in completed', {
                    sleep: sleepQuality,
                    mental: mentalEnergy,
                    physical: physicalReadiness,
                    score: result.readiness?.overall_score
                });

                onComplete(result.readiness);
            } else {
                throw new Error(result.error || 'Failed to save bio-check');
            }
        } catch (error) {
            logger.error('[BioCheck] Failed to submit:', error);
            // Still complete, but show error
            onComplete(null);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate preview score (simplified)
    const previewScore = Math.round(
        (sleepQuality * 40 + mentalEnergy * 35 + physicalReadiness * 25) / 10
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                onClick={onSkip}
            />

            {/* Main Card - Glassmorphism */}
            <div className="relative w-full max-w-md">
                {/* Ambient Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl animate-pulse-slow" />

                {/* Card */}
                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Bar - System Status */}
                    <div className="h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500 animate-shimmer" />

                    {/* Content */}
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 mb-4">
                                <span className="text-3xl animate-pulse-slow">🧬</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                System Bio-Check
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Biologische Wahrheit erfassen. ~10 Sekunden.
                            </p>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-6 mb-8">
                            {/* Sleep Quality */}
                            <SliderControl
                                label="Sleep Quality"
                                sublabel="Wie tief war die Erholung?"
                                value={sleepQuality}
                                onChange={setSleepQuality}
                                icon="😴"
                                color="indigo"
                            />

                            {/* Mental Energy */}
                            <SliderControl
                                label="Mental Energy"
                                sublabel="Fokus-Bereitschaft?"
                                value={mentalEnergy}
                                onChange={setMentalEnergy}
                                icon="🧠"
                                color="blue"
                            />

                            {/* Physical Readiness */}
                            <SliderControl
                                label="Physical Readiness"
                                sublabel="Stress-Resilienz?"
                                value={physicalReadiness}
                                onChange={setPhysicalReadiness}
                                icon="💪"
                                color="emerald"
                            />
                        </div>

                        {/* Preview Score */}
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300 text-sm font-medium">
                                    Readiness Projection
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                previewScore >= 80
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                                    : previewScore >= 60
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                                    : 'bg-gradient-to-r from-orange-500 to-red-400'
                                            }`}
                                            style={{ width: `${previewScore}%` }}
                                        />
                                    </div>
                                    <span className="text-xl font-bold text-white tabular-nums">
                                        {previewScore}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {/* Skip Button */}
                            <button
                                onClick={onSkip}
                                className="flex-1 py-3 px-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl transition-all text-sm font-medium"
                            >
                                Später
                            </button>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>System Aktivieren</span>
                                        <span className="text-lg">→</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Footer Note */}
                        <p className="text-center text-xs text-slate-500 mt-4">
                            Deine biologische Wahrheit. Keine Lügen, keine Ausreden.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Slider Control Component
 */
function SliderControl({ label, sublabel, value, onChange, icon, color }) {
    const colorMap = {
        indigo: {
            bg: 'from-indigo-500/20 to-indigo-600/20',
            border: 'border-indigo-500/30',
            track: 'bg-indigo-500',
            thumb: 'bg-indigo-500'
        },
        blue: {
            bg: 'from-blue-500/20 to-blue-600/20',
            border: 'border-blue-500/30',
            track: 'bg-blue-500',
            thumb: 'bg-blue-500'
        },
        emerald: {
            bg: 'from-emerald-500/20 to-emerald-600/20',
            border: 'border-emerald-500/30',
            track: 'bg-emerald-500',
            thumb: 'bg-emerald-500'
        }
    };

    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <div>
                        <p className="text-white font-semibold text-sm">{label}</p>
                        <p className="text-slate-400 text-xs">{sublabel}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
                    <span className="text-slate-500 text-sm">/10</span>
                </div>
            </div>

            {/* Slider */}
            <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 focus:outline-none focus:ring-2 focus:ring-${color}-500/50`}
                style={{
                    background: `linear-gradient(to right, var(--color-${color}) 0%, var(--color-${color}) ${value * 10}%, rgb(51 65 85) ${value * 10}%, rgb(51 65 85) 100%)`
                }}
            />

            {/* Labels */}
            <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-500">Kritisch</span>
                <span className="text-[10px] text-slate-500">Optimal</span>
            </div>
        </div>
    );
}

// Custom CSS for slider thumb
const sliderStyles = `
    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid currentColor;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid currentColor;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    @keyframes shimmer {
        0% {
            background-position: -200% center;
        }
        100% {
            background-position: 200% center;
        }
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
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = sliderStyles;
    document.head.appendChild(styleElement);
}
