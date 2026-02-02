import React from 'react';

/**
 * Phase Timeline Component
 * Shows the 3-phase progression of the plan
 */
export default function PhaseTimeline({ phases }) {
    if (!phases || phases.length === 0) return null;

    return (
        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {phases.map((phase, index) => (
                    <div
                        key={index}
                        className="relative"
                    >
                        {/* Connector Line (except for last phase) */}
                        {index < phases.length - 1 && (
                            <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent -z-10" />
                        )}

                        {/* Phase Card */}
                        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700 hover:border-amber-500/50 transition-all hover:scale-105">
                            {/* Icon */}
                            <div className="text-4xl mb-3 text-center">
                                {phase.icon || '🌟'}
                            </div>

                            {/* Phase Name */}
                            <h4 className="text-white font-bold text-lg text-center mb-2">
                                {phase.name}
                            </h4>

                            {/* Days */}
                            <p className="text-amber-400 text-sm text-center font-medium mb-3">
                                Tage {phase.days}
                            </p>

                            {/* Description */}
                            <p className="text-slate-400 text-xs text-center leading-relaxed mb-3">
                                {phase.focus}
                            </p>

                            {/* Intensity Badge */}
                            <div className="flex justify-center">
                                <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 text-xs font-medium border border-slate-700">
                                    {phase.intensity}
                                </span>
                            </div>
                        </div>

                        {/* Phase Number */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center text-sm shadow-lg">
                            {index + 1}
                        </div>
                    </div>
                ))}
            </div>

            {/* Timeline Progress Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Tag 1</span>
                    <span>Tag 10</span>
                    <span>Tag 20</span>
                    <span>Tag 30</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-purple-500 rounded-full" />
                </div>
                <p className="text-center text-slate-500 text-xs mt-3">
                    Deine 30-Tage-Reise zu mehr Vitalität
                </p>
            </div>
        </div>
    );
}
