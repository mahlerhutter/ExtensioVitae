import React, { useState, useEffect } from 'react';
import { getActiveUserModules } from '../../lib/moduleService';
import { getTrackingHistory } from '../../lib/dailyTrackingService';

/**
 * Month Overview Component
 *
 * Shows a rolling 30-day view: last 10 days + today + next 19 days
 * Includes all active modules with completion rates and color coding
 */
export default function MonthOverview({ plan, progress, currentDay, onDayClick, startDate: planStartDate, userId }) {
  const [trackingHistory, setTrackingHistory] = useState({});
  const [activeModules, setActiveModules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // Load tracking history and modules
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    try {
      // Get last 10 days + next 20 days of tracking
      const historyStart = new Date();
      historyStart.setDate(historyStart.getDate() - 10);
      const historyEnd = new Date();
      historyEnd.setDate(historyEnd.getDate() + 20);

      const [history, modules] = await Promise.all([
        getTrackingHistory(userId, historyStart, historyEnd),
        getActiveUserModules(userId)
      ]);

      // Convert history to a map by date
      const historyMap = {};
      (history || []).forEach(h => {
        historyMap[h.tracking_date] = h;
      });

      setTrackingHistory(historyMap);
      setActiveModules(modules || []);
    } catch (error) {
      console.error('Error loading tracking history:', error);
    }
  };

  // Generate 30 days: -10 to +19 from today
  const generateDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -10; i <= 19; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Get tracking data for this day
      const tracking = trackingHistory[dateStr];

      // Calculate completion from tracking or plan progress
      let completion = 0;
      let totalTasks = 0;
      let completedTasks = 0;

      if (tracking) {
        totalTasks = tracking.total_tasks || 0;
        completedTasks = tracking.completed_tasks || 0;
        completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      } else if (plan && i >= 0 && i < plan.days?.length) {
        // Fallback to plan progress for current plan days
        const planDayIndex = currentDay - 1 + i;
        if (planDayIndex >= 0 && planDayIndex < plan.days?.length) {
          const dayProgress = progress[planDayIndex + 1];
          const dayTasks = plan.days[planDayIndex]?.tasks || [];
          totalTasks = dayTasks.length;
          if (dayProgress) {
            completedTasks = dayTasks.filter(t => dayProgress[t.id]).length;
            completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          }
        }
      }

      days.push({
        date,
        dateStr,
        isToday: i === 0,
        isPast: i < 0,
        isFuture: i > 0,
        dayOffset: i,
        completion,
        totalTasks,
        completedTasks,
        tracking
      });
    }

    return days;
  };

  const days = generateDays();

  // Get status and color for a day
  const getDayStyle = (day) => {
    if (day.isFuture) {
      return {
        bg: 'bg-slate-800/30',
        border: 'border-slate-700/30',
        text: 'text-slate-600'
      };
    }

    if (day.totalTasks === 0) {
      return {
        bg: 'bg-slate-800/50',
        border: 'border-slate-700/50',
        text: 'text-slate-500'
      };
    }

    // Color based on completion percentage
    if (day.completion >= 100) {
      return {
        bg: 'bg-green-500/30',
        border: 'border-green-500/50',
        text: 'text-green-400'
      };
    } else if (day.completion >= 75) {
      return {
        bg: 'bg-amber-500/30',
        border: 'border-amber-500/50',
        text: 'text-amber-400'
      };
    } else if (day.completion >= 50) {
      return {
        bg: 'bg-orange-500/30',
        border: 'border-orange-500/50',
        text: 'text-orange-400'
      };
    } else if (day.completion > 0) {
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/40',
        text: 'text-red-400'
      };
    } else {
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400/70'
      };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* Header with active modules count */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Dein Tracking</h3>
          <p className="text-xs text-slate-500">
            {activeModules.length > 0
              ? `${activeModules.length} aktive Module`
              : 'Keine aktiven Module'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">
            {days[0].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – {days[days.length - 1].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Active Modules Pills */}
      {activeModules.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeModules.map(module => {
            const def = module.definition || module.module;
            return (
              <span
                key={module.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-xs"
                title={def?.name_de || 'Modul'}
              >
                <span>{def?.icon || '📋'}</span>
                <span className="text-slate-400 truncate max-w-[80px]">
                  {def?.name_de || 'Modul'}
                </span>
                <span className="text-slate-500">
                  Tag {module.current_day || 1}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Calendar Grid - 10 columns x 3 rows */}
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => {
          const style = getDayStyle(day);
          const dayNum = day.date.getDate();
          const monthShort = day.date.toLocaleDateString('de-DE', { month: 'short' }).slice(0, 3);

          return (
            <button
              key={day.dateStr}
              onClick={() => {
                setSelectedDay(day);
                if (onDayClick && !day.isFuture) {
                  // Calculate plan day number if applicable
                  const planDay = planStartDate
                    ? Math.floor((day.date - new Date(planStartDate)) / (1000 * 60 * 60 * 24)) + 1
                    : null;
                  if (planDay && planDay > 0 && planDay <= (plan?.days?.length || 30)) {
                    onDayClick(planDay);
                  }
                }
              }}
              className={`relative p-1 rounded-lg border transition-all ${style.bg} ${style.border} ${
                day.isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-900' : ''
              } ${!day.isFuture ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
            >
              {/* Date */}
              <div className={`text-center ${day.isToday ? 'text-amber-400 font-bold' : style.text}`}>
                <div className="text-sm font-medium">{dayNum}</div>
                <div className="text-[9px] opacity-70">{monthShort}</div>
              </div>

              {/* Completion indicator */}
              {!day.isFuture && day.totalTasks > 0 && (
                <div className="mt-0.5">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        day.completion >= 100 ? 'bg-green-500' :
                        day.completion >= 75 ? 'bg-amber-500' :
                        day.completion >= 50 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${day.completion}%` }}
                    />
                  </div>
                  <div className={`text-[8px] text-center mt-0.5 ${style.text}`}>
                    {day.completedTasks}/{day.totalTasks}
                  </div>
                </div>
              )}

              {/* Today marker */}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-green-500" />
          <span>100%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-amber-500" />
          <span>75%+</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-orange-500" />
          <span>50%+</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-red-500" />
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-slate-700" />
          <span>Zukunft</span>
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && !selectedDay.isFuture && selectedDay.totalTasks > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              {selectedDay.date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Fortschritt</span>
                <span className={`font-medium ${
                  selectedDay.completion >= 100 ? 'text-green-400' :
                  selectedDay.completion >= 75 ? 'text-amber-400' :
                  selectedDay.completion >= 50 ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {selectedDay.completion}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    selectedDay.completion >= 100 ? 'bg-green-500' :
                    selectedDay.completion >= 75 ? 'bg-amber-500' :
                    selectedDay.completion >= 50 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${selectedDay.completion}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {selectedDay.completedTasks}/{selectedDay.totalTasks}
              </div>
              <div className="text-xs text-slate-500">Aufgaben</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
