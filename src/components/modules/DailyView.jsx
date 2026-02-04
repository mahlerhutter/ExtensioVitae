import React, { useState, useEffect, useCallback } from 'react';
import { getDailyTracking, completeTask, skipTask, undoTaskCompletion, calculateStreak } from '../../lib/dailyTrackingService';
import { getUserMode, formatModeForDisplay, MODES } from '../../lib/modeService';
import { useToast } from '../Toast';
import ModuleTaskItem from './ModuleTaskItem';
import DailyProgress from './DailyProgress';

// Time block configuration
const TIME_BLOCKS = {
  morning: { start: 5, end: 11, label_de: 'Morgen', label_en: 'Morning', icon: '🌅' },
  day: { start: 11, end: 17, label_de: 'Tag', label_en: 'Day', icon: '☀️' },
  evening: { start: 17, end: 22, label_de: 'Abend', label_en: 'Evening', icon: '🌆' },
  night: { start: 22, end: 5, label_de: 'Nacht', label_en: 'Night', icon: '🌙' }
};

function getCurrentTimeBlock() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getTaskTimeBlock(scheduledTime) {
  if (!scheduledTime) return null;
  const hour = parseInt(scheduledTime.split(':')[0], 10);
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function formatDateGerman(date) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('de-DE', options);
}

/**
 * Daily View Component
 *
 * Shows today's aggregated tasks from all active modules.
 * Supports focus mode (current time block) and full view.
 * Integrates with emergency modes.
 */
export default function DailyView({ userId, language = 'de' }) {
  const [tracking, setTracking] = useState(null);
  const [modeState, setModeState] = useState(null);
  const [streak, setStreak] = useState(0);
  const [viewMode, setViewMode] = useState('focus'); // 'focus' | 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const currentBlock = getCurrentTimeBlock();
  const blockConfig = TIME_BLOCKS[currentBlock];

  // Load data
  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [trackingData, mode, streakCount] = await Promise.all([
        getDailyTracking(userId),
        getUserMode(userId),
        calculateStreak(userId)
      ]);

      setTracking(trackingData);
      setModeState(mode);
      setStreak(streakCount);
    } catch (err) {
      console.error('Error loading daily view:', err);
      setError(language === 'de' ? 'Fehler beim Laden' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [userId, language]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task handlers
  const handleCompleteTask = async (taskId) => {
    const result = await completeTask(taskId);
    if (result.success) {
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }

      // Update local state
      setTracking(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t
        ),
        tasks_completed: prev.tasks_completed + 1,
        completion_percentage: Math.round(((prev.tasks_completed + 1) / prev.tasks_total) * 100)
      }));

      addToast(language === 'de' ? '✓ Erledigt!' : '✓ Done!', 'success');
    } else {
      addToast(result.error || 'Error', 'error');
    }
  };

  const handleSkipTask = async (taskId, reason) => {
    const result = await skipTask(taskId, reason);
    if (result.success) {
      setTracking(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'skipped', skipped_reason: reason } : t
        )
      }));
      addToast(language === 'de' ? 'Übersprungen' : 'Skipped', 'info');
    }
  };

  const handleUndoTask = async (taskId) => {
    const result = await undoTaskCompletion(taskId);
    if (result.success) {
      const wasCompleted = tracking.tasks.find(t => t.id === taskId)?.status === 'completed';

      setTracking(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'pending', completed_at: null, skipped_reason: null } : t
        ),
        tasks_completed: wasCompleted ? prev.tasks_completed - 1 : prev.tasks_completed,
        completion_percentage: wasCompleted
          ? Math.round(((prev.tasks_completed - 1) / prev.tasks_total) * 100)
          : prev.completion_percentage
      }));
    }
  };

  // Filter tasks based on view mode
  const getDisplayTasks = () => {
    if (!tracking?.tasks) return [];

    let tasks = tracking.tasks;

    if (viewMode === 'focus') {
      tasks = tasks.filter(task => {
        const taskBlock = getTaskTimeBlock(task.scheduled_time);
        // Show tasks for current block, or tasks without scheduled time
        return taskBlock === currentBlock || !task.scheduled_time;
      });
    }

    // Sort: pending first, then by scheduled time
    return tasks.sort((a, b) => {
      // Completed/skipped go to bottom
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.status === 'pending' && b.status !== 'pending') return -1;

      // Then by time
      if (a.scheduled_time && b.scheduled_time) {
        return a.scheduled_time.localeCompare(b.scheduled_time);
      }
      if (a.scheduled_time) return -1;
      if (b.scheduled_time) return 1;
      return 0;
    });
  };

  const displayTasks = getDisplayTasks();
  const pendingTasks = displayTasks.filter(t => t.status === 'pending');
  const completedTasks = tracking?.tasks?.filter(t => t.status === 'completed') || [];

  // Mode display
  const modeDisplay = modeState ? formatModeForDisplay(modeState) : null;
  const isEmergencyMode = modeDisplay?.isActive;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-800 rounded" />
          <div className="h-16 bg-slate-800 rounded" />
          <div className="h-16 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-red-800/50 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
        >
          {language === 'de' ? 'Erneut versuchen' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!tracking || !tracking.tasks?.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {language === 'de' ? 'Keine Module aktiv' : 'No Active Modules'}
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          {language === 'de'
            ? 'Aktiviere Module im Module Hub, um Aufgaben zu sehen.'
            : 'Activate modules in the Module Hub to see tasks.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {language === 'de' ? 'Heute' : 'Today'}
            </h2>
            <p className="text-amber-400 text-sm mt-1 font-medium">
              {formatDateGerman(new Date())}
            </p>
          </div>

          <DailyProgress
            completed={completedTasks.length}
            total={tracking.tasks_total}
            streak={streak}
          />
        </div>

        {/* Streak indicator */}
        {streak > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <span className="text-amber-400">🔥</span>
            <span className="text-amber-400 text-sm font-medium">
              {streak} {language === 'de' ? 'Tage Streak' : 'Day Streak'}
            </span>
          </div>
        )}
      </div>

      {/* Emergency Mode Notice */}
      {isEmergencyMode && (
        <div className="mx-6 mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{modeDisplay.icon}</span>
            <div className="flex-1">
              <p className="text-blue-300 text-sm font-medium">
                {language === 'de' ? modeDisplay.name_de : modeDisplay.name_en} Mode
              </p>
              {modeDisplay.timeRemainingText && (
                <p className="text-blue-400/70 text-xs mt-0.5">
                  {language === 'de' ? 'Noch' : 'Remaining'}: {modeDisplay.timeRemainingText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Toggle */}
      <div className="mx-6 mt-4 flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-medium">
            {viewMode === 'focus'
              ? `${blockConfig.icon} ${language === 'de' ? blockConfig.label_de : blockConfig.label_en}`
              : `📋 ${language === 'de' ? 'Alle Aufgaben' : 'All Tasks'}`}
          </span>
          {viewMode === 'focus' && pendingTasks.length === 0 && (
            <span className="text-xs text-slate-500">
              ({language === 'de' ? 'Keine Aufgaben' : 'No tasks'})
            </span>
          )}
        </div>

        <button
          onClick={() => setViewMode(viewMode === 'focus' ? 'all' : 'focus')}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          style={{ backgroundColor: viewMode === 'focus' ? '#fbbf24' : '#475569' }}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              viewMode === 'focus' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Tasks */}
      <div className="p-6">
        {viewMode === 'focus' && pendingTasks.length === 0 ? (
          <div className="py-12 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="text-5xl mb-4">🧘</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {language === 'de' ? 'Aktive Erholung' : 'Active Recovery'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {language === 'de'
                ? 'Keine Aufgaben für diesen Zeitblock.'
                : 'No tasks for this time block.'}
            </p>

            {/* Next block indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-amber-400 text-sm font-medium">
                {currentBlock === 'morning' && (language === 'de' ? 'Nächstes: 11:00 (Tag)' : 'Next: 11:00 (Day)')}
                {currentBlock === 'day' && (language === 'de' ? 'Nächstes: 17:00 (Abend)' : 'Next: 17:00 (Evening)')}
                {currentBlock === 'evening' && (language === 'de' ? 'Nächstes: 05:00 (Morgen)' : 'Next: 05:00 (Morning)')}
                {currentBlock === 'night' && (language === 'de' ? 'Nächstes: 05:00 (Morgen)' : 'Next: 05:00 (Morning)')}
              </span>
            </div>

            <p className="text-slate-500 text-xs mt-4">
              💧 {language === 'de' ? 'Hydratisiert bleiben' : 'Stay hydrated'} ·
              🚶 {language === 'de' ? 'Spazieren gehen' : 'Take a walk'} ·
              🧠 {language === 'de' ? 'Geist ruhen lassen' : 'Rest your mind'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task) => (
              <ModuleTaskItem
                key={task.id}
                task={task}
                language={language}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={(reason) => handleSkipTask(task.id, reason)}
                onUndo={() => handleUndoTask(task.id)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {tracking.tasks_total} {language === 'de' ? 'Aufgaben gesamt' : 'total tasks'}
          </span>
          <span className={completedTasks.length === tracking.tasks_total ? 'text-amber-400' : 'text-slate-400'}>
            {completedTasks.length === tracking.tasks_total
              ? (language === 'de' ? '🎉 Alles erledigt!' : '🎉 All done!')
              : `${pendingTasks.length} ${language === 'de' ? 'übrig' : 'remaining'}`}
          </span>
        </div>
      </div>
    </div>
  );
}
