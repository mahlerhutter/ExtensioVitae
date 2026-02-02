import React from 'react';
import ProgressRing from './ProgressRing';
import TaskItem from './TaskItem';

// Helper to format date
function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

/**
 * Today Card Component
 * Shows today's tasks with progress tracking
 */
export default function TodayCard({ day, dayData, progress, onTaskToggle, startDate }) {
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

            <div className="space-y-3">
                {dayData.tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        completed={progress[task.id] || false}
                        onToggle={() => onTaskToggle(day, task.id)}
                    />
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400">Gesamt: {totalTime} min</span>
                <span className={remainingTime === 0 ? 'text-amber-400' : 'text-slate-400'}>
                    {remainingTime === 0 ? 'Alles erledigt!' : `${remainingTime} min übrig`}
                </span>
            </div>
        </div>
    );
}
