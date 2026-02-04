import React, { useState } from 'react';
import { completeTask } from '../../lib/dailyTrackingService';

/**
 * Today Task List Component
 *
 * Displays today's tasks grouped by time of day with rich interactions.
 */
export default function TodayTaskList({ tasks, modules, language = 'de', onTaskComplete }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-slate-400">
          {language === 'de'
            ? 'Keine Aufgaben für heute'
            : 'No tasks for today'}
        </p>
      </div>
    );
  }

  // Group tasks by time of day
  const groupedTasks = groupTasksByTimeOfDay(tasks);

  // Get module info for a task
  const getModuleForTask = (task) => {
    return modules?.find(m => m.id === task.module_instance_id);
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([timeOfDay, timeTasks]) => {
        if (timeTasks.length === 0) return null;

        const timeConfig = TIME_OF_DAY_CONFIG[timeOfDay];
        const completedInGroup = timeTasks.filter(t => t.completed).length;
        const isCurrentTime = isCurrentTimeOfDay(timeOfDay);

        return (
          <div key={timeOfDay}>
            {/* Time of day header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCurrentTime ? timeConfig.activeBg : 'bg-slate-800'
              }`}>
                <span className="text-lg">{timeConfig.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isCurrentTime ? 'text-white' : 'text-slate-400'}`}>
                  {timeConfig[language]}
                </h3>
              </div>
              <span className="text-sm text-slate-500">
                {completedInGroup}/{timeTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2 ml-11">
              {timeTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  module={getModuleForTask(task)}
                  language={language}
                  onComplete={() => onTaskComplete?.(task.id)}
                  isCurrentTime={isCurrentTime}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, module, language, onComplete, isCurrentTime }) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (task.completed || completing) return;

    setCompleting(true);
    try {
      await completeTask(task.id);
      onComplete?.();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompleting(false);
    }
  };

  const pillarConfig = PILLAR_CONFIG[task.pillar] || PILLAR_CONFIG.other;

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all ${
        task.completed
          ? 'bg-slate-800/30 border-slate-700/30'
          : isCurrentTime
            ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            : 'bg-slate-800/30 border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={handleComplete}
          disabled={task.completed || completing}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all flex items-center justify-center ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : completing
                ? 'border-amber-500 animate-pulse'
                : 'border-slate-600 hover:border-amber-500'
          }`}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
            {language === 'de' ? task.title_de : (task.title_en || task.title_de)}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Duration */}
            {task.duration_minutes && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.duration_minutes} min
              </span>
            )}

            {/* Pillar */}
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${pillarConfig.bg} ${pillarConfig.text}`}>
              <span>{pillarConfig.icon}</span>
              <span>{pillarConfig[language]}</span>
            </span>

            {/* Module source */}
            {module && (
              <span className="text-xs text-slate-500">
                {module.icon} {language === 'de' ? module.name_de : module.name_en}
              </span>
            )}
          </div>
        </div>

        {/* Points/XP indicator */}
        {task.points && !task.completed && (
          <span className="text-xs text-amber-500 font-medium">
            +{task.points} XP
          </span>
        )}
      </div>
    </div>
  );
}

// Time of day configuration
const TIME_OF_DAY_CONFIG = {
  morning: {
    de: 'Morgen',
    en: 'Morning',
    icon: '🌅',
    activeBg: 'bg-orange-500/20',
    hours: [5, 6, 7, 8, 9, 10, 11]
  },
  afternoon: {
    de: 'Mittag',
    en: 'Afternoon',
    icon: '☀️',
    activeBg: 'bg-yellow-500/20',
    hours: [12, 13, 14, 15, 16]
  },
  evening: {
    de: 'Abend',
    en: 'Evening',
    icon: '🌆',
    activeBg: 'bg-purple-500/20',
    hours: [17, 18, 19, 20]
  },
  night: {
    de: 'Nacht',
    en: 'Night',
    icon: '🌙',
    activeBg: 'bg-indigo-500/20',
    hours: [21, 22, 23, 0, 1, 2, 3, 4]
  },
  anytime: {
    de: 'Flexibel',
    en: 'Anytime',
    icon: '⭐',
    activeBg: 'bg-slate-700/50',
    hours: []
  }
};

// Pillar configuration
const PILLAR_CONFIG = {
  sleep: { de: 'Schlaf', en: 'Sleep', icon: '😴', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  nutrition: { de: 'Ernährung', en: 'Nutrition', icon: '🥗', bg: 'bg-green-500/20', text: 'text-green-400' },
  exercise: { de: 'Bewegung', en: 'Exercise', icon: '🏃', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  stress: { de: 'Stress', en: 'Stress', icon: '🧘', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  mindfulness: { de: 'Achtsamkeit', en: 'Mindfulness', icon: '🧠', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  supplements: { de: 'Supplements', en: 'Supplements', icon: '💊', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  connection: { de: 'Verbindung', en: 'Connection', icon: '👥', bg: 'bg-pink-500/20', text: 'text-pink-400' },
  environment: { de: 'Umwelt', en: 'Environment', icon: '🌿', bg: 'bg-teal-500/20', text: 'text-teal-400' },
  other: { de: 'Sonstiges', en: 'Other', icon: '📋', bg: 'bg-slate-500/20', text: 'text-slate-400' }
};

// Group tasks by time of day
function groupTasksByTimeOfDay(tasks) {
  const groups = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
    anytime: []
  };

  tasks.forEach(task => {
    const timeOfDay = task.time_of_day || 'anytime';
    if (groups[timeOfDay]) {
      groups[timeOfDay].push(task);
    } else {
      groups.anytime.push(task);
    }
  });

  return groups;
}

// Check if current time matches time of day
function isCurrentTimeOfDay(timeOfDay) {
  const hour = new Date().getHours();
  const config = TIME_OF_DAY_CONFIG[timeOfDay];
  return config?.hours?.includes(hour) || false;
}
