import React, { useState } from 'react';

/**
 * Activity Preview Component
 * Shows sample activities from different days
 */
export default function ActivityPreview({ samples }) {
    const [expandedDay, setExpandedDay] = useState(null);

    if (!samples || samples.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {samples.map((sample, index) => (
                <div
                    key={index}
                    className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden hover:border-amber-500/50 transition-all"
                >
                    {/* Day Header */}
                    <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <h4 className="text-white font-semibold">
                                Tag {sample.day}
                            </h4>
                            <span className="text-amber-400 text-xs font-medium">
                                {sample.activities?.length || 0} Aufgaben
                            </span>
                        </div>
                    </div>

                    {/* Activities List */}
                    <div className="p-4 space-y-2">
                        {sample.activities && sample.activities.length > 0 ? (
                            sample.activities.map((activity, actIndex) => (
                                <div
                                    key={actIndex}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span className="text-slate-300 leading-relaxed">
                                        {activity}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm italic">
                                Keine Aktivitäten verfügbar
                            </p>
                        )}
                    </div>

                    {/* Phase Indicator */}
                    <div className="px-4 pb-4">
                        <div className="text-xs text-slate-500">
                            {sample.day <= 10 && (
                                <span className="inline-flex items-center gap-1">
                                    <span>🌱</span> Foundation-Phase
                                </span>
                            )}
                            {sample.day > 10 && sample.day <= 20 && (
                                <span className="inline-flex items-center gap-1">
                                    <span>🌿</span> Growth-Phase
                                </span>
                            )}
                            {sample.day > 20 && (
                                <span className="inline-flex items-center gap-1">
                                    <span>🌳</span> Mastery-Phase
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
