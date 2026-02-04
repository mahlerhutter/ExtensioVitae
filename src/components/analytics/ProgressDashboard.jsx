import React, { useState, useEffect } from 'react';
import { getProgressOverview, getCompletionHistory, getUserAchievements } from '../../lib/analyticsService';
import StreakDisplay from './StreakDisplay';
import AchievementsList from './AchievementsList';
import CompletionChart from './CompletionChart';
import PillarBreakdown from './PillarBreakdown';

/**
 * Progress Dashboard Component
 *
 * Main analytics dashboard showing progress, streaks, and achievements.
 */
export default function ProgressDashboard({ userId, language = 'de' }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    loadData();
  }, [userId, timeRange]);

  const loadData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [overviewData, historyData, achievementsData] = await Promise.all([
        getProgressOverview(userId),
        getCompletionHistory(userId, timeRange),
        getUserAchievements(userId)
      ]);

      setOverview(overviewData);
      setHistory(historyData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak */}
        <StreakDisplay streak={overview?.currentStreak || 0} language={language} />

        {/* Total Tasks */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
          <div className="text-3xl font-bold text-white mb-1">
            {overview?.totalTasksCompleted || 0}
          </div>
          <div className="text-sm text-purple-300">
            {language === 'de' ? 'Aufgaben erledigt' : 'Tasks completed'}
          </div>
        </div>
      </div>

      {/* This Week Summary */}
      {overview?.thisWeek && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-white font-medium mb-3">
            {language === 'de' ? 'Diese Woche' : 'This Week'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {overview.thisWeek.tasks_completed}/{overview.thisWeek.tasks_total}
              </div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Aufgaben' : 'Tasks'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${
                overview.thisWeek.completion_rate >= 80 ? 'text-green-400' :
                overview.thisWeek.completion_rate >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(overview.thisWeek.completion_rate)}%
              </div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Erledigt' : 'Completed'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {overview.thisWeek.total_time_minutes || 0}
              </div>
              <div className="text-xs text-slate-400">
                {language === 'de' ? 'Minuten' : 'Minutes'}
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          {overview.thisWeek.completion_trend !== 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-center gap-2">
              <span className={overview.thisWeek.completion_trend > 0 ? 'text-green-400' : 'text-red-400'}>
                {overview.thisWeek.completion_trend > 0 ? '↑' : '↓'}
                {Math.abs(Math.round(overview.thisWeek.completion_trend))}%
              </span>
              <span className="text-sm text-slate-400">
                {language === 'de' ? 'vs. letzte Woche' : 'vs. last week'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Completion Chart */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">
            {language === 'de' ? 'Fortschritt' : 'Progress'}
          </h3>
          <div className="flex gap-2">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  timeRange === days
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <CompletionChart data={history} language={language} />
      </div>

      {/* Pillar Breakdown */}
      {overview?.pillarDistribution && Object.keys(overview.pillarDistribution).length > 0 && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-white font-medium mb-4">
            {language === 'de' ? 'Nach Säulen' : 'By Pillar'}
          </h3>
          <PillarBreakdown distribution={overview.pillarDistribution} language={language} />
        </div>
      )}

      {/* Achievements */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-white font-medium mb-4">
          {language === 'de' ? 'Erfolge' : 'Achievements'}
          {achievements.length > 0 && (
            <span className="ml-2 text-sm text-slate-400">({achievements.length})</span>
          )}
        </h3>
        <AchievementsList achievements={achievements} language={language} />
      </div>
    </div>
  );
}
