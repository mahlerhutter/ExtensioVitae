// ExtensioVitae - Smart Task Recommendation Component
// Intelligent task recommendation based on recovery, time of day, and streaks

import { useState, useEffect } from 'react';
import { Zap, Clock, TrendingUp, Target, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import { getTasks, completeTask, getTodayCompletions } from '../../services/taskService';
import { getTodayRecovery } from '../../services/recoveryService';

export default function SmartTaskRecommendation() {
    const [recommendedTask, setRecommendedTask] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [todayRecovery, setTodayRecovery] = useState(null);
    const [completedToday, setCompletedToday] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        loadRecommendation();
    }, []);

    const loadRecommendation = async () => {
        try {
            setLoading(true);
            const [tasks, recovery, completed] = await Promise.all([
                getTasks({ isActive: true }),
                getTodayRecovery(),
                getTodayCompletions(),
            ]);

            setAllTasks(tasks);
            setTodayRecovery(recovery);
            setCompletedToday(completed);

            // Calculate best next action
            const recommendation = calculateNextBestAction(tasks, recovery, completed);
            setRecommendedTask(recommendation);
        } catch (err) {
            console.error('Failed to load recommendation:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateNextBestAction = (tasks, recovery, completed) => {
        if (!tasks || tasks.length === 0) return null;

        // Filter out already completed tasks today
        const completedTaskIds = new Set(completed.map(c => c.task_id));
        const pendingTasks = tasks.filter(t => !completedTaskIds.has(t.id));

        if (pendingTasks.length === 0) return null;

        const now = new Date();
        const currentHour = now.getHours();
        const timeOfDay = getTimeOfDay(now);
        const recoveryState = recovery?.readiness_state || 'moderate';

        // Scoring system
        const scoredTasks = pendingTasks.map(task => {
            let score = 0;
            const reasons = [];

            // 1. Streak Priority (highest weight)
            if (task.current_streak > 0) {
                score += task.current_streak * 10;
                reasons.push(`${task.current_streak}-day streak active 🔥`);
            }

            // 2. Time of Day Match
            if (task.optimal_time_of_day && task.optimal_time_of_day.includes(timeOfDay)) {
                score += 20;
                reasons.push(`Optimal time: ${timeOfDay}`);
            }

            // 3. Recovery State Match
            const intensityScore = getIntensityScore(task.intensity, recoveryState);
            score += intensityScore.score;
            if (intensityScore.reason) {
                reasons.push(intensityScore.reason);
            }

            // 4. Recurrence (daily tasks get priority)
            if (task.is_recurring) {
                score += 15;
                reasons.push('Daily habit');
            }

            // 5. Never completed before (onboarding boost)
            if (task.total_completions === 0) {
                score += 5;
                reasons.push('New task - build the habit!');
            }

            // 6. Overdue penalty (if last_completed_at is more than 2 days ago for recurring tasks)
            if (task.is_recurring && task.last_completed_at) {
                const daysSinceCompletion = Math.floor(
                    (now - new Date(task.last_completed_at)) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceCompletion > 2) {
                    score += daysSinceCompletion * 5;
                    reasons.push(`${daysSinceCompletion} days since last completion`);
                }
            }

            return {
                ...task,
                score,
                reasons,
            };
        });

        // Sort by score (highest first)
        scoredTasks.sort((a, b) => b.score - a.score);

        return scoredTasks[0];
    };

    const getIntensityScore = (intensity, recoveryState) => {
        // Match intensity to recovery state
        if (recoveryState === 'optimal') {
            if (intensity === 'high') return { score: 25, reason: 'High intensity - you\'re ready!' };
            if (intensity === 'medium') return { score: 15, reason: 'Good match for your recovery' };
            if (intensity === 'low') return { score: 5, reason: null };
        } else if (recoveryState === 'moderate') {
            if (intensity === 'high') return { score: 5, reason: null };
            if (intensity === 'medium') return { score: 25, reason: 'Perfect match for moderate recovery' };
            if (intensity === 'low') return { score: 15, reason: 'Safe choice today' };
        } else { // low recovery
            if (intensity === 'high') return { score: -10, reason: 'Too intense - consider recovery instead' };
            if (intensity === 'medium') return { score: 5, reason: null };
            if (intensity === 'low') return { score: 25, reason: 'Ideal for low recovery day' };
        }
        return { score: 0, reason: null };
    };

    const getTimeOfDay = (date) => {
        const hour = date.getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    };

    const handleCompleteTask = async () => {
        if (!recommendedTask) return;

        try {
            setCompleting(true);
            await completeTask(recommendedTask.id, {
                recovery_score_at_completion: todayRecovery?.recovery_score,
            });

            // Reload recommendation
            await loadRecommendation();
        } catch (err) {
            console.error('Failed to complete task:', err);
            alert('Failed to complete task. Please try again.');
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Calculating next best action...</span>
                </div>
            </div>
        );
    }

    if (!recommendedTask) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">All tasks completed!</h3>
                    <p className="text-sm text-gray-600">
                        Great work today. Take a well-deserved break.
                    </p>
                </div>
            </div>
        );
    }

    const getIntensityColor = (intensity) => {
        switch (intensity) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'exercise': return '🏃';
            case 'nutrition': return '🥗';
            case 'supplements': return '💊';
            case 'recovery': return '🧘';
            case 'cognitive': return '🧠';
            case 'social': return '👥';
            default: return '✅';
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Zap className="w-6 h-6 mr-2" />
                    <h2 className="text-xl font-bold">Smart Recommendation</h2>
                </div>
                <div className="text-sm opacity-75 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
            </div>

            {/* Recommended Task Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 mb-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start flex-1">
                        <span className="text-3xl mr-3">{getCategoryIcon(recommendedTask.category)}</span>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{recommendedTask.title}</h3>
                            {recommendedTask.description && (
                                <p className="text-sm opacity-90 mb-2">{recommendedTask.description}</p>
                            )}

                            {/* Task Metadata */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {recommendedTask.duration_minutes && (
                                    <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                                        {recommendedTask.duration_minutes} min
                                    </span>
                                )}
                                {recommendedTask.intensity && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getIntensityColor(recommendedTask.intensity)}`}>
                                        {recommendedTask.intensity} intensity
                                    </span>
                                )}
                                {recommendedTask.current_streak > 0 && (
                                    <span className="px-2 py-1 bg-orange-500 rounded text-xs font-medium flex items-center">
                                        <Flame className="w-3 h-3 mr-1" />
                                        {recommendedTask.current_streak} day streak
                                    </span>
                                )}
                            </div>

                            {/* Reasons */}
                            {recommendedTask.reasons && recommendedTask.reasons.length > 0 && (
                                <div className="space-y-1">
                                    {recommendedTask.reasons.slice(0, 3).map((reason, idx) => (
                                        <div key={idx} className="flex items-center text-sm opacity-90">
                                            <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0" />
                                            <span>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleCompleteTask}
                    disabled={completing}
                    className="w-full mt-4 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {completing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                            Completing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Mark as Complete
                        </>
                    )}
                </button>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">{completedToday.length}</div>
                    <div className="text-xs opacity-75">Completed Today</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">{allTasks.filter(t => t.current_streak > 0).length}</div>
                    <div className="text-xs opacity-75">Active Streaks</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">
                        {todayRecovery?.recovery_score || '--'}
                    </div>
                    <div className="text-xs opacity-75">Recovery Score</div>
                </div>
            </div>
        </div>
    );
}
