import React from 'react';

/**
 * Completion Chart Component
 *
 * Simple bar chart showing daily completion rates.
 */
export default function CompletionChart({ data, language = 'de', height = 120 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <p className="text-sm">
          {language === 'de' ? 'Noch keine Daten' : 'No data yet'}
        </p>
      </div>
    );
  }

  // Fill in missing days
  const filledData = fillMissingDays(data);

  // Calculate max for scaling
  const maxTotal = Math.max(...filledData.map(d => d.tasks_total || 1), 1);

  // Format day label
  const formatDay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return language === 'de' ? 'Heute' : 'Today';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return language === 'de' ? 'Gestern' : 'Yesterday';
    }

    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'short'
    }).charAt(0);
  };

  // Calculate bar color based on completion percentage
  const getBarColor = (completed, total) => {
    if (total === 0) return 'bg-slate-700';
    const percentage = (completed / total) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    if (percentage > 0) return 'bg-orange-400';
    return 'bg-red-400';
  };

  // Calculate average
  const validDays = filledData.filter(d => d.tasks_total > 0);
  const avgCompletion = validDays.length > 0
    ? validDays.reduce((sum, d) => sum + (d.completion_percentage || 0), 0) / validDays.length
    : 0;

  return (
    <div>
      {/* Chart */}
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {filledData.map((day, index) => {
          const barHeight = day.tasks_total > 0
            ? (day.tasks_total / maxTotal) * 100
            : 5;
          const completedHeight = day.tasks_total > 0
            ? (day.tasks_completed / maxTotal) * 100
            : 0;

          return (
            <div
              key={day.tracking_date || index}
              className="flex-1 flex flex-col items-center justify-end"
            >
              {/* Bar */}
              <div className="relative w-full max-w-[20px]">
                {/* Background (total) */}
                <div
                  className="w-full bg-slate-700/50 rounded-t transition-all duration-300"
                  style={{ height: `${barHeight}%`, minHeight: '4px' }}
                >
                  {/* Filled (completed) */}
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all duration-300 ${getBarColor(day.tasks_completed, day.tasks_total)}`}
                    style={{ height: `${day.tasks_total > 0 ? (day.tasks_completed / day.tasks_total) * 100 : 0}%`, minHeight: day.tasks_completed > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>

              {/* Day label */}
              <span className="text-[10px] text-slate-500 mt-1">
                {formatDay(day.tracking_date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats summary */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between text-sm">
        <div className="text-slate-400">
          {language === 'de' ? 'Durchschnitt' : 'Average'}:
          <span className={`ml-2 font-medium ${
            avgCompletion >= 80 ? 'text-green-400' :
            avgCompletion >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(avgCompletion)}%
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-slate-500">100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs text-slate-500">50-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-500">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fill in missing days with empty data
function fillMissingDays(data) {
  if (!data || data.length === 0) return [];

  // Sort by date
  const sorted = [...data].sort((a, b) =>
    new Date(a.tracking_date) - new Date(b.tracking_date)
  );

  const startDate = new Date(sorted[0].tracking_date);
  const endDate = new Date(sorted[sorted.length - 1].tracking_date);

  // Create a map of existing data
  const dataMap = new Map(sorted.map(d => [d.tracking_date, d]));

  // Fill in gaps
  const filled = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    filled.push(dataMap.get(dateStr) || {
      tracking_date: dateStr,
      tasks_total: 0,
      tasks_completed: 0,
      completion_percentage: 0
    });
    current.setDate(current.getDate() + 1);
  }

  return filled;
}
