import React from 'react';

/**
 * Streak Display Component
 *
 * Shows the current streak with visual feedback.
 */
export default function StreakDisplay({ streak, language = 'de' }) {
  // Determine streak level for styling
  const getStreakLevel = () => {
    if (streak >= 90) return { label: 'legendary', color: 'from-purple-500 to-pink-500', icon: '👑' };
    if (streak >= 60) return { label: 'master', color: 'from-amber-400 to-orange-500', icon: '🏆' };
    if (streak >= 30) return { label: 'expert', color: 'from-amber-500 to-amber-600', icon: '⭐' };
    if (streak >= 14) return { label: 'dedicated', color: 'from-orange-500 to-red-500', icon: '🔥🔥🔥' };
    if (streak >= 7) return { label: 'committed', color: 'from-orange-400 to-orange-500', icon: '🔥🔥' };
    if (streak >= 3) return { label: 'starting', color: 'from-yellow-500 to-orange-400', icon: '🔥' };
    return { label: 'new', color: 'from-slate-600 to-slate-700', icon: '✨' };
  };

  const level = getStreakLevel();

  // Milestone progress (next milestone)
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find(m => m > streak) || streak + 30;
  const prevMilestone = milestones.filter(m => m <= streak).pop() || 0;
  const progress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${level.color} border border-white/10`}>
      {/* Main streak display */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{level.icon}</span>
        <div>
          <div className="text-3xl font-bold text-white">{streak}</div>
          <div className="text-sm text-white/80">
            {language === 'de' ? 'Tage Streak' : 'Day Streak'}
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      {streak > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>{prevMilestone}</span>
            <span>{nextMilestone}</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/30 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-1 text-center">
            {language === 'de'
              ? `Noch ${nextMilestone - streak} Tage bis ${nextMilestone}`
              : `${nextMilestone - streak} days to ${nextMilestone}`}
          </p>
        </div>
      )}

      {/* No streak yet */}
      {streak === 0 && (
        <p className="text-sm text-white/70 mt-2">
          {language === 'de'
            ? 'Erledige heute eine Aufgabe!'
            : 'Complete a task today!'}
        </p>
      )}
    </div>
  );
}
