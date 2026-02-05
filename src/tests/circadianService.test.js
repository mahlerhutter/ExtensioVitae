import { describe, it, expect } from 'vitest';
import circadianService from '../lib/circadianService';

describe('Circadian Service', () => {
    describe('getLightRecommendation', () => {
        it('should recommend bright light in the morning', () => {
            const result = circadianService.getLightRecommendation(8); // 8 AM

            expect(result.intensity).toBe('bright');
            expect(result.blueLight).toBe(true);
            expect(result.recommendation).toContain('bright');
        });

        it('should recommend no blue light in the evening', () => {
            const result = circadianService.getLightRecommendation(21); // 9 PM

            expect(result.blueLight).toBe(false);
            expect(result.recommendation).toContain('blue');
        });

        it('should recommend dim light at night', () => {
            const result = circadianService.getLightRecommendation(23); // 11 PM

            expect(result.intensity).toBe('dim');
            expect(result.blueLight).toBe(false);
        });

        it('should handle midnight correctly', () => {
            const result = circadianService.getLightRecommendation(0);

            expect(result.intensity).toBe('dim');
            expect(result.blueLight).toBe(false);
        });

        it('should include lux values', () => {
            const result = circadianService.getLightRecommendation(12);

            expect(result.lux).toBeDefined();
            expect(result.lux).toBeGreaterThan(0);
        });
    });

    describe('getOptimalWakeTime', () => {
        it('should calculate wake time from sleep time', () => {
            const sleepTime = 22; // 10 PM
            const wakeTime = circadianService.getOptimalWakeTime(sleepTime, 8);

            expect(wakeTime).toBe(6); // 6 AM
        });

        it('should handle overnight calculation', () => {
            const sleepTime = 23; // 11 PM
            const wakeTime = circadianService.getOptimalWakeTime(sleepTime, 8);

            expect(wakeTime).toBe(7); // 7 AM
        });

        it('should default to 8 hours sleep', () => {
            const sleepTime = 22;
            const wakeTime = circadianService.getOptimalWakeTime(sleepTime);

            expect(wakeTime).toBe(6);
        });
    });

    describe('isOptimalSleepWindow', () => {
        it('should return true for optimal sleep time', () => {
            const isOptimal = circadianService.isOptimalSleepWindow(22); // 10 PM

            expect(isOptimal).toBe(true);
        });

        it('should return false for too early', () => {
            const isOptimal = circadianService.isOptimalSleepWindow(20); // 8 PM

            expect(isOptimal).toBe(false);
        });

        it('should return false for too late', () => {
            const isOptimal = circadianService.isOptimalSleepWindow(2); // 2 AM

            expect(isOptimal).toBe(false);
        });
    });

    describe('calculateMelatonsinOnset', () => {
        it('should calculate melatonin onset time', () => {
            const wakeTime = 7; // 7 AM
            const onset = circadianService.calculateMelatonsinOnset(wakeTime);

            expect(onset).toBeGreaterThanOrEqual(20);
            expect(onset).toBeLessThanOrEqual(23);
        });

        it('should adjust for late wake times', () => {
            const wakeTime = 10; // 10 AM
            const onset = circadianService.calculateMelatonsinOnset(wakeTime);

            expect(onset).toBeGreaterThan(22);
        });
    });

    describe('shouldBlockBlueLight', () => {
        it('should block blue light after sunset', () => {
            const shouldBlock = circadianService.shouldBlockBlueLight(21); // 9 PM

            expect(shouldBlock).toBe(true);
        });

        it('should not block blue light during day', () => {
            const shouldBlock = circadianService.shouldBlockBlueLight(12); // Noon

            expect(shouldBlock).toBe(false);
        });

        it('should block blue light at night', () => {
            const shouldBlock = circadianService.shouldBlockBlueLight(23); // 11 PM

            expect(shouldBlock).toBe(true);
        });
    });
});
