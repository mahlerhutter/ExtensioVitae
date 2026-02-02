import React from 'react';

// Pillar configuration
const PILLARS = {
    sleep: { label: 'Sleep', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    movement: { label: 'Movement', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    nutrition: { label: 'Nutrition', color: 'bg-orange-500', textColor: 'text-orange-400' },
    stress: { label: 'Stress', color: 'bg-rose-500', textColor: 'text-rose-400' },
    connection: { label: 'Connection', color: 'bg-blue-500', textColor: 'text-blue-400' },
    mental: { label: 'Mental', color: 'bg-purple-500', textColor: 'text-purple-400' },
    supplements: { label: 'Supplements', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
};

/**
 * Day Preview Modal Component
 * Shows a preview of a specific day's tasks and details
 */
export default function DayPreviewModal({ isOpen, onClose, dayData, progress, actualDate, currentDay }) {
    if (!isOpen || !dayData) return null;

    const dayProgress = progress || {};
    const completedCount = dayData.tasks.filter(t => dayProgress[t.id]).length;
    const totalTasks = dayData.tasks.length;
    const isComplete = completedCount === totalTasks;
    const isPast = dayData.day < currentDay;
    const isToday = dayData.day === currentDay;
    const isFuture = dayData.day > currentDay;

    const phaseColors = {
        stabilize: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        build: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        optimize: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        consolidate: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const phaseLabels = {
        stabilize: 'Stabilisieren',
        build: 'Aufbauen',
        optimize: 'Optimieren',
        consolidate: 'Festigen'
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                {dayData.day}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    Tag {dayData.day} von 30
                                    {isToday && (
                                        <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-xs font-bold rounded">HEUTE</span>
                                    )}
                                    {isFuture && (
                                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs font-medium rounded">Zukünftig</span>
                                    )}
                                </h2>
                                <p className="text-slate-400 text-sm mt-0.5">{formatDate(actualDate)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Phase and Progress */}
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${phaseColors[dayData.phase]}`}>
                            Phase: {phaseLabels[dayData.phase]}
                        </span>
                        <span className="text-slate-500 text-xs">
                            {dayData.total_time_minutes} min gesamt
                        </span>
                        {!isFuture && (
                            <span className={`text-xs px-2 py-1 rounded ${isComplete
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : completedCount > 0
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-slate-700 text-slate-400'
                                }`}>
                                {completedCount}/{totalTasks} erledigt
                            </span>
                        )}
                    </div>
                </div>

                {/* Tasks List */}
                <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Aufgaben für diesen Tag
                    </h3>
                    {dayData.tasks.map((task) => {
                        const pillarInfo = PILLARS[task.pillar] || { label: task.pillar, color: 'bg-slate-500', textColor: 'text-slate-400' };
                        const isDone = dayProgress[task.id];

                        return (
                            <div
                                key={task.id}
                                className={`p-4 rounded-lg border transition-all ${isDone
                                        ? 'bg-slate-800/30 border-slate-700/50'
                                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox indicator */}
                                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isDone
                                            ? 'bg-amber-400 border-amber-400'
                                            : 'border-slate-600'
                                        }`}>
                                        {isDone && (
                                            <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Task content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`w-2 h-2 rounded-full ${pillarInfo.color}`} />
                                            <span className={`text-xs font-medium ${pillarInfo.textColor}`}>
                                                {pillarInfo.label}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'
                                            }`}>
                                            {task.task}
                                        </p>
                                    </div>

                                    {/* Time estimate */}
                                    <span className="text-slate-500 text-xs whitespace-nowrap flex-shrink-0">
                                        {task.time_minutes} min
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-700 bg-slate-800/30">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            {isFuture ? (
                                <span>📅 Dieser Tag liegt in der Zukunft</span>
                            ) : isComplete ? (
                                <span className="text-emerald-400">✅ Alle Aufgaben erledigt!</span>
                            ) : isPast ? (
                                <span>⏰ Vergangener Tag - {completedCount} von {totalTasks} erledigt</span>
                            ) : (
                                <span>🎯 Heute - {totalTasks - completedCount} Aufgaben übrig</span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-sm font-medium transition-colors"
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
