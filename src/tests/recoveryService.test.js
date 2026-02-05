import { describe, it, expect, beforeEach } from 'vitest';
import recoveryService from '../lib/recoveryService';

describe('Recovery Service', () => {
    describe('calculateRecoveryScore', () => {
        it('should calculate excellent recovery score', () => {
            const result = recoveryService.calculateRecoveryScore({
                sleepHours: 8,
                wakeUps: 0,
                feeling: 'energized'
            });

            expect(result.score).toBeGreaterThanOrEqual(85);
            expect(result.level).toBe('excellent');
            expect(result.shouldSwapIntensity).toBe(false);
        });

        it('should calculate poor recovery score', () => {
            const result = recoveryService.calculateRecoveryScore({
                sleepHours: 5,
                wakeUps: 4,
                feeling: 'exhausted'
            });

            expect(result.score).toBeLessThan(50);
            expect(result.level).toBe('poor');
            expect(result.shouldSwapIntensity).toBe(true);
        });

        it('should calculate moderate recovery score', () => {
            const result = recoveryService.calculateRecoveryScore({
                sleepHours: 7,
                wakeUps: 2,
                feeling: 'neutral'
            });

            expect(result.score).toBeGreaterThanOrEqual(50);
            expect(result.score).toBeLessThan(70);
            expect(result.level).toBe('moderate');
        });

        it('should throw error for missing required fields', () => {
            expect(() => {
                recoveryService.calculateRecoveryScore({
                    sleepHours: 7
                    // missing feeling
                });
            }).toThrow('Missing required fields');
        });

        it('should include breakdown in result', () => {
            const result = recoveryService.calculateRecoveryScore({
                sleepHours: 7.5,
                wakeUps: 1,
                feeling: 'energized'
            });

            expect(result.breakdown).toBeDefined();
            expect(result.breakdown.sleepScore).toBeDefined();
            expect(result.breakdown.qualityScore).toBeDefined();
            expect(result.breakdown.feelingScore).toBeDefined();
        });

        it('should include recommendations', () => {
            const result = recoveryService.calculateRecoveryScore({
                sleepHours: 5,
                wakeUps: 3,
                feeling: 'exhausted'
            });

            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('shouldSwapTask', () => {
        it('should swap HIIT to Yoga Nidra for poor recovery', () => {
            const task = { title: 'HIIT Workout' };
            const swap = recoveryService.shouldSwapTask(task, 45);

            expect(swap).not.toBeNull();
            expect(swap.swappedTask).toBe('Yoga Nidra');
            expect(swap.category).toBe('recovery_swap');
        });

        it('should swap Heavy Lifting for poor recovery', () => {
            const task = { title: 'Heavy Lifting Session' };
            const swap = recoveryService.shouldSwapTask(task, 40);

            expect(swap).not.toBeNull();
            expect(swap.swappedTask).toBe('Light Stretching');
        });

        it('should not swap for good recovery', () => {
            const task = { title: 'HIIT Workout' };
            const swap = recoveryService.shouldSwapTask(task, 75);

            expect(swap).toBeNull();
        });

        it('should not swap non-intensity tasks', () => {
            const task = { title: 'Morning Walk' };
            const swap = recoveryService.shouldSwapTask(task, 40);

            expect(swap).toBeNull();
        });

        it('should reduce intensity for high-intensity tasks', () => {
            const task = { title: 'Training Session', intensity: 5 };
            const swap = recoveryService.shouldSwapTask(task, 45);

            expect(swap).not.toBeNull();
            expect(swap.category).toBe('intensity_reduction');
        });
    });

    describe('applyRecoverySwaps', () => {
        it('should swap multiple tasks for poor recovery', () => {
            const tasks = [
                { title: 'HIIT Workout' },
                { title: 'Heavy Lifting' },
                { title: 'Morning Walk' }
            ];

            const result = recoveryService.applyRecoverySwaps(tasks, 40);

            expect(result.swapCount).toBe(2);
            expect(result.tasks[0].swapped).toBe(true);
            expect(result.tasks[1].swapped).toBe(true);
            expect(result.tasks[2].swapped).toBeUndefined();
        });

        it('should not swap tasks for good recovery', () => {
            const tasks = [
                { title: 'HIIT Workout' },
                { title: 'Heavy Lifting' }
            ];

            const result = recoveryService.applyRecoverySwaps(tasks, 80);

            expect(result.swapCount).toBe(0);
            expect(result.tasks[0].swapped).toBeUndefined();
        });

        it('should handle empty task array', () => {
            const result = recoveryService.applyRecoverySwaps([], 40);

            expect(result.tasks).toEqual([]);
            expect(result.swapCount).toBe(0);
        });
    });

    describe('analyzeRecoveryTrend', () => {
        it('should detect improving trend', () => {
            const history = [
                { score: 85, recorded_at: '2026-02-05' },
                { score: 82, recorded_at: '2026-02-04' },
                { score: 80, recorded_at: '2026-02-03' },
                { score: 78, recorded_at: '2026-02-02' },
                { score: 75, recorded_at: '2026-02-01' },
                { score: 72, recorded_at: '2026-01-31' },
                { score: 70, recorded_at: '2026-01-30' },
                { score: 65, recorded_at: '2026-01-29' }
            ];

            const trend = recoveryService.analyzeRecoveryTrend(history);

            expect(trend.trend).toBe('improving');
            expect(trend.change).toBeGreaterThan(0);
        });

        it('should detect declining trend', () => {
            const history = [
                { score: 65, recorded_at: '2026-02-05' },
                { score: 68, recorded_at: '2026-02-04' },
                { score: 70, recorded_at: '2026-02-03' },
                { score: 72, recorded_at: '2026-02-02' },
                { score: 75, recorded_at: '2026-02-01' },
                { score: 78, recorded_at: '2026-01-31' },
                { score: 80, recorded_at: '2026-01-30' },
                { score: 82, recorded_at: '2026-01-29' }
            ];

            const trend = recoveryService.analyzeRecoveryTrend(history);

            expect(trend.trend).toBe('declining');
            expect(trend.change).toBeLessThan(0);
        });

        it('should detect stable trend', () => {
            const history = [
                { score: 75, recorded_at: '2026-02-05' },
                { score: 76, recorded_at: '2026-02-04' },
                { score: 74, recorded_at: '2026-02-03' },
                { score: 75, recorded_at: '2026-02-02' },
                { score: 76, recorded_at: '2026-02-01' },
                { score: 74, recorded_at: '2026-01-31' },
                { score: 75, recorded_at: '2026-01-30' },
                { score: 75, recorded_at: '2026-01-29' }
            ];

            const trend = recoveryService.analyzeRecoveryTrend(history);

            expect(trend.trend).toBe('stable');
        });

        it('should handle insufficient data', () => {
            const history = [
                { score: 75, recorded_at: '2026-02-05' }
            ];

            const trend = recoveryService.analyzeRecoveryTrend(history);

            expect(trend.trend).toBe('insufficient_data');
        });
    });

    describe('Recovery Thresholds', () => {
        it('should have correct threshold values', () => {
            expect(recoveryService.RECOVERY_THRESHOLDS.POOR).toBe(50);
            expect(recoveryService.RECOVERY_THRESHOLDS.MODERATE).toBe(70);
            expect(recoveryService.RECOVERY_THRESHOLDS.GOOD).toBe(85);
        });
    });

    describe('Feeling Scores', () => {
        it('should have correct feeling score values', () => {
            expect(recoveryService.FEELING_SCORES.EXHAUSTED).toBe(0);
            expect(recoveryService.FEELING_SCORES.NEUTRAL).toBe(50);
            expect(recoveryService.FEELING_SCORES.ENERGIZED).toBe(100);
        });
    });
});
