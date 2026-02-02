import React, { useState } from 'react';
import DayCell from './DayCell';
import DayPreviewModal from './DayPreviewModal';

/**
 * Month Overview Component
 * 30-day calendar grid showing progress status with actual dates
 */
export default function MonthOverview({ plan, progress, currentDay, onDayClick, startDate }) {
    const [previewDay, setPreviewDay] = useState(null);

    const getDayStatus = (day) => {
        if (day > currentDay) return 'future';
        const dayProgress = progress[day];
        if (!dayProgress) return 'incomplete';
        const dayTasks = plan.days[day - 1].tasks;
        const completedCount = dayTasks.filter((t) => dayProgress[t.id]).length;
        if (completedCount === dayTasks.length) return 'complete';
        if (completedCount > 0) return 'partial';
        return 'incomplete';
    };

    // Calculate actual date for a given day number
    const getActualDate = (dayNumber) => {
        if (!startDate) return null;
        const date = new Date(startDate);
        date.setDate(date.getDate() + (dayNumber - 1));
        return date;
    };

    const handleDayClick = (dayNumber) => {
        // Set preview day to show modal
        setPreviewDay(dayNumber);
        // Also call the original onDayClick if provided
        if (onDayClick) {
            onDayClick(dayNumber);
        }
    };

    const handleClosePreview = () => {
        setPreviewDay(null);
    };

    const previewDayData = previewDay ? plan.days[previewDay - 1] : null;
    const previewProgress = previewDay ? progress[previewDay] : null;
    const previewActualDate = previewDay ? getActualDate(previewDay) : null;

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Your 30 Days</h3>
                    {startDate && (
                        <span className="text-xs text-slate-500">
                            {new Date(startDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - {getActualDate(30)?.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-10 gap-2">
                    {plan.days.map((dayData) => (
                        <DayCell
                            key={dayData.day}
                            day={dayData.day}
                            status={getDayStatus(dayData.day)}
                            isToday={dayData.day === currentDay}
                            actualDate={getActualDate(dayData.day)}
                            onClick={() => handleDayClick(dayData.day)}
                        />
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-400" />
                        Complete
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-400/30 border border-amber-400/50" />
                        Partial
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-700" />
                        Missed
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-800/50" />
                        Future
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 text-center">
                        💡 Klicke auf einen Tag, um Details und Aufgaben anzuzeigen
                    </p>
                </div>
            </div>

            {/* Day Preview Modal */}
            <DayPreviewModal
                isOpen={previewDay !== null}
                onClose={handleClosePreview}
                dayData={previewDayData}
                progress={previewProgress}
                actualDate={previewActualDate}
                currentDay={currentDay}
            />
        </>
    );
}
