import React, { useEffect, useState } from 'react';
import { getCircadianIntelligence } from '../../lib/circadianService';

/**
 * Circadian Widget
 * Visualizes the sun path and current biological status.
 * Premium "Intelligence Layer" component.
 */
export default function CircadianWidget() {
    const [intel, setIntel] = useState(null);

    useEffect(() => {
        const update = () => {
            setIntel(getCircadianIntelligence());
        };
        update();
        const timer = setInterval(update, 60000);
        return () => clearInterval(timer);
    }, []);

    if (!intel) return null;

    const { currentPhase, activeWindow, sunPath } = intel;

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden relative">
            {/* Background Sun Arc Visualization */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-900 transition-all duration-1000"
                    style={{ width: `${sunPath}%` }}
                />
            </div>

            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Biological Rhythm
                </h4>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeWindow ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeWindow ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
                    </span>
                    <span className="text-[10px] font-bold text-white tabular-nums">
                        {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="text-lg">
                        {currentPhase === 'Morning Pulse' && '🌅'}
                        {currentPhase === 'Flow State' && '⚡'}
                        {currentPhase === 'Melatonin Onset' && '🌙'}
                        {currentPhase === 'Baseline' && '🧘'}
                    </span>
                    {currentPhase}
                </div>

                {activeWindow ? (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-1 duration-500">
                        <p className="text-[11px] text-amber-400 font-medium mb-1">
                            {activeWindow.label}
                        </p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                            <p className="text-[10px] text-slate-300 leading-tight">
                                <span className="text-amber-500 font-bold">Action:</span> {activeWindow.action}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-[11px] text-slate-500 italic mt-2">
                        Normal steady-state rhythm.
                    </p>
                )}
            </div>

            {/* Micro-Animation Sun Path Bogen (SVG) */}
            <div className="mt-4 h-8 flex items-end justify-center">
                <svg viewBox="0 0 100 20" className="w-full h-full opacity-30">
                    <path
                        d="M5 18 Q 50 2, 95 18"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-700"
                        strokeWidth="1"
                    />
                    <circle
                        cx={5 + (sunPath * 0.9)}
                        cy={18 - (Math.sin((sunPath / 100) * Math.PI) * 16)}
                        r="2"
                        className="fill-amber-400"
                    />
                </svg>
            </div>
        </div>
    );
}
