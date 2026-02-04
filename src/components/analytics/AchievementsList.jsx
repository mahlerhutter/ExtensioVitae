import React from 'react';

/**
 * Achievements List Component
 *
 * Displays user achievements with icons and dates.
 */
export default function AchievementsList({ achievements, language = 'de', limit = 6 }) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🎯</div>
        <p className="text-slate-400 text-sm">
          {language === 'de'
            ? 'Noch keine Erfolge freigeschaltet'
            : 'No achievements unlocked yet'}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          {language === 'de'
            ? 'Erledige Aufgaben und baue deinen Streak auf!'
            : 'Complete tasks and build your streak!'}
        </p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  const displayedAchievements = achievements.slice(0, limit);
  const remainingCount = achievements.length - limit;

  return (
    <div className="space-y-3">
      {/* Achievement grid */}
      <div className="grid grid-cols-2 gap-3">
        {displayedAchievements.map((achievement, index) => (
          <div
            key={achievement.id || index}
            className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">{achievement.icon || '🏆'}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate">
                  {language === 'de' ? achievement.name_de : (achievement.name_en || achievement.name_de)}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(achievement.earned_at)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {remainingCount > 0 && (
        <div className="text-center">
          <span className="text-sm text-slate-400">
            +{remainingCount} {language === 'de' ? 'weitere' : 'more'}
          </span>
        </div>
      )}

      {/* All achievements preview (locked) */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <h4 className="text-sm text-slate-400 mb-3">
          {language === 'de' ? 'Nächste Erfolge' : 'Next Achievements'}
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {getUpcomingAchievements(achievements, language).map((achievement, index) => (
            <div
              key={index}
              className="flex-shrink-0 p-2 rounded-lg bg-slate-900/30 border border-slate-700/30 opacity-50"
            >
              <span className="text-xl grayscale">{achievement.icon}</span>
              <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                {achievement.hint}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Get upcoming achievements that user hasn't earned yet
function getUpcomingAchievements(earnedAchievements, language) {
  const earned = new Set(earnedAchievements.map(a => a.achievement_type));

  const allAchievements = [
    { type: 'streak_7', icon: '🔥🔥', hint: language === 'de' ? '7-Tage Streak' : '7-Day Streak' },
    { type: 'streak_14', icon: '🔥🔥🔥', hint: language === 'de' ? '14-Tage Streak' : '14-Day Streak' },
    { type: 'streak_30', icon: '⭐', hint: language === 'de' ? '30-Tage Streak' : '30-Day Streak' },
    { type: 'streak_60', icon: '⭐⭐', hint: language === 'de' ? '60-Tage Streak' : '60-Day Streak' },
    { type: 'streak_90', icon: '🏆', hint: language === 'de' ? '90-Tage Streak' : '90-Day Streak' },
    { type: 'tasks_50', icon: '✓✓', hint: language === 'de' ? '50 Tasks' : '50 Tasks' },
    { type: 'tasks_100', icon: '💪', hint: language === 'de' ? '100 Tasks' : '100 Tasks' },
    { type: 'perfect_week', icon: '🌟🌟', hint: language === 'de' ? 'Perfekte Woche' : 'Perfect Week' },
    { type: 'first_blood_check', icon: '🩸', hint: language === 'de' ? 'Erstes Blutbild' : 'First Blood Check' }
  ];

  return allAchievements
    .filter(a => !earned.has(a.type))
    .slice(0, 4);
}
