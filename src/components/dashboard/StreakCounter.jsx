import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './StreakCounter.css';

/**
 * StreakCounter - Displays user's current check-in streak
 * 
 * Calculates consecutive days of morning check-ins.
 * Shows fire emoji with count and animates on hover.
 * 
 * @param {string} userId - User ID to calculate streak for
 */
export default function StreakCounter({ userId }) {
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadStreak();
        }
    }, [userId]);

    async function loadStreak() {
        try {
            // Get last 30 days of check-ins
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('recovery_tracking')
                .select('check_in_date')
                .eq('user_id', userId)
                .gte('check_in_date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('check_in_date', { ascending: false });

            if (error) throw error;

            const currentStreak = calculateStreak(data);
            setStreak(currentStreak);
        } catch (error) {
            console.error('Error loading streak:', error);
            setStreak(0);
        } finally {
            setLoading(false);
        }
    }

    function calculateStreak(checkIns) {
        if (!checkIns || checkIns.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start from today and go backwards
        let currentDate = new Date(today);

        for (let i = 0; i < checkIns.length; i++) {
            const checkInDate = new Date(checkIns[i].check_in_date);
            checkInDate.setHours(0, 0, 0, 0);

            const expectedDate = new Date(currentDate);
            expectedDate.setHours(0, 0, 0, 0);

            if (checkInDate.getTime() === expectedDate.getTime()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    if (loading) {
        return (
            <div className="streak-counter streak-counter--loading">
                <span className="streak-counter__fire">🔥</span>
                <span className="streak-counter__number">...</span>
            </div>
        );
    }

    return (
        <div
            className={`streak-counter ${streak >= 7 ? 'streak-counter--milestone' : ''}`}
            title={`${streak} day streak! Keep it going!`}
        >
            <span className="streak-counter__fire">🔥</span>
            <span className="streak-counter__number">{streak}</span>
            <span className="streak-counter__label">day{streak !== 1 ? 's' : ''}</span>
        </div>
    );
}
