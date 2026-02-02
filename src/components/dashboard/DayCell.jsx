import React from 'react';

/**
 * Day Cell Component
 * Individual day button in the month overview grid with actual date
 */
export default function DayCell({ day, status, isToday, onClick, actualDate }) {
    const statusStyles = {
        complete: 'bg-amber-400 text-slate-900',
        partial: 'bg-amber-400/30 text-amber-400 border border-amber-400/50',
        incomplete: 'bg-slate-700 text-slate-400',
        future: 'bg-slate-800/50 text-slate-600',
    };

    // Format date as "DD.MM"
    const formattedDate = actualDate
        ? `${actualDate.getDate()}.${actualDate.getMonth() + 1}`
        : '';

    // Format full date for tooltip
    const fullDate = actualDate
        ? actualDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
        : '';

    return (
        <button
            onClick={onClick}
            title={fullDate}
            className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all hover:scale-105 hover:shadow-lg group ${statusStyles[status]
                } ${isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`}
        >
            <span className="text-sm font-bold">{day}</span>
            {actualDate && (
                <span className="text-[9px] opacity-60 mt-0.5 group-hover:opacity-100 transition-opacity">
                    {formattedDate}
                </span>
            )}
        </button>
    );
}
