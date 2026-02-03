import React, { useState } from 'react';
import ProgressRing from './ProgressRing';
import TaskItem from './TaskItem';
import { getCurrentBlock, getBlockDisplayName, isTaskInCurrentBlock } from '../../utils/time';

// Helper to format date
function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

/**
 * Today Card Component
 * Shows today's tasks with progress tracking and Focus Mode
 */
export default function TodayCard({ day, dayData, progress, onTaskToggle, startDate }) {
    const [viewMode, setViewMode] = useState('focus'); // 'focus' | 'list'
    const currentBlock = getCurrentBlock();

    // Filter tasks based on view mode
    const displayTasks = viewMode === 'focus'
        ? dayData.tasks.filter(task => isTaskInCurrentBlock(task, currentBlock))
        : dayData.tasks;

    const completedCount = dayData.tasks.filter((t) => progress[t.id]).length;
    const totalTime = dayData.tasks.reduce((acc, t) => acc + t.time_minutes, 0);
    const remainingTime = dayData.tasks
        .filter((t) => !progress[t.id])
        .reduce((acc, t) => acc + t.time_minutes, 0);

    // Calculate actual date for this plan day
    const today = new Date();
    const planDayDate = startDate ? new Date(new Date(startDate).getTime() + (day - 1) * 24 * 60 * 60 * 1000) : today;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Heute</h2>
                    <p className="text-amber-400 text-sm mt-1 font-medium">{formatDate(today)}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Tag {day} von 30</p>
                </div>
                <ProgressRing completed={completedCount} total={dayData.tasks.length} />
            </div>

            {/* Focus Mode Toggle */}
            <div className="mb-4 flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-medium">
                        {viewMode === 'focus' ? `🎯 Focus: ${getBlockDisplayName(currentBlock)}` : '📋 Alle Aufgaben'}
                    </span>
                    {viewMode === 'focus' && displayTasks.length === 0 && (
                        <span className="text-xs text-slate-500">(Keine Aufgaben)</span>
                    )}
                </div>

                <button
                    onClick={() => setViewMode(viewMode === 'focus' ? 'list' : 'focus')}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    style={{ backgroundColor: viewMode === 'focus' ? '#fbbf24' : '#475569' }}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${viewMode === 'focus' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {/* Tasks Display */}
            {viewMode === 'focus' && displayTasks.length === 0 ? (
                <div className="py-12 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="text-5xl mb-4">🧘</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Active Recovery</h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Keine Aufgaben für diesen Zeitblock.
                    </p>

                    {/* Next Protocol Time */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-amber-400 text-sm font-medium">
                            {currentBlock === 'morning' && 'Next Protocol: 11:00 (Midday)'}
                            {currentBlock === 'day' && 'Next Protocol: 21:00 (Evening)'}
                            {currentBlock === 'evening' && 'Next Protocol: 07:00 (Morning)'}
                        </span>
                    </div>

                    <p className="text-slate-500 text-xs mt-4">
                        💧 Stay hydrated · 🚶 Take a walk · 🧠 Rest your mind
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            completed={progress[task.id] || false}
                            onToggle={() => onTaskToggle(day, task.id)}
                        />
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400">Gesamt: {totalTime} min</span>
                <span className={remainingTime === 0 ? 'text-amber-400' : 'text-slate-400'}>
                    {remainingTime === 0 ? 'Alles erledigt!' : `${remainingTime} min übrig`}
                </span>
            </div>
        </div>
    );
}
