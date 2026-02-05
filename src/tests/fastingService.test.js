import { describe, it, expect } from 'vitest';
import fastingService from '../lib/fastingService';

describe('Fasting Service', () => {
    describe('calculateEatingWindow', () => {
        it('should calculate 16:8 eating window', () => {
            const result = fastingService.calculateEatingWindow({
                protocol: '16:8',
                startTime: 12 // Noon
            });

            expect(result.fastingHours).toBe(16);
            expect(result.eatingHours).toBe(8);
            expect(result.startTime).toBe(12);
            expect(result.endTime).toBe(20); // 8 PM
        });

        it('should calculate 18:6 eating window', () => {
            const result = fastingService.calculateEatingWindow({
                protocol: '18:6',
                startTime: 13 // 1 PM
            });

            expect(result.fastingHours).toBe(18);
            expect(result.eatingHours).toBe(6);
            expect(result.endTime).toBe(19); // 7 PM
        });

        it('should handle overnight window', () => {
            const result = fastingService.calculateEatingWindow({
                protocol: '16:8',
                startTime: 18 // 6 PM
            });

            expect(result.endTime).toBe(2); // 2 AM next day
        });

        it('should include circadian alignment', () => {
            const result = fastingService.calculateEatingWindow({
                protocol: '16:8',
                startTime: 12
            });

            expect(result.circadianAligned).toBeDefined();
        });
    });

    describe('isCircadianAligned', () => {
        it('should be aligned for early eating window', () => {
            const aligned = fastingService.isCircadianAligned(8, 16); // 8 AM - 4 PM

            expect(aligned).toBe(true);
        });

        it('should not be aligned for late eating window', () => {
            const aligned = fastingService.isCircadianAligned(14, 22); // 2 PM - 10 PM

            expect(aligned).toBe(false);
        });

        it('should be aligned for noon start', () => {
            const aligned = fastingService.isCircadianAligned(12, 20); // Noon - 8 PM

            expect(aligned).toBe(true);
        });
    });

    describe('getRecommendedStartTime', () => {
        it('should recommend morning start for early risers', () => {
            const startTime = fastingService.getRecommendedStartTime({
                wakeTime: 6,
                sleepTime: 22
            });

            expect(startTime).toBeLessThan(12);
        });

        it('should recommend later start for late risers', () => {
            const startTime = fastingService.getRecommendedStartTime({
                wakeTime: 9,
                sleepTime: 1
            });

            expect(startTime).toBeGreaterThanOrEqual(12);
        });

        it('should default to noon', () => {
            const startTime = fastingService.getRecommendedStartTime({});

            expect(startTime).toBe(12);
        });
    });

    describe('calculateFastingProgress', () => {
        it('should calculate progress correctly', () => {
            const progress = fastingService.calculateFastingProgress({
                fastStartTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                targetFastingHours: 16
            });

            expect(progress.hoursElapsed).toBe(8);
            expect(progress.percentComplete).toBe(50);
            expect(progress.hoursRemaining).toBe(8);
        });

        it('should handle completed fast', () => {
            const progress = fastingService.calculateFastingProgress({
                fastStartTime: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
                targetFastingHours: 16
            });

            expect(progress.percentComplete).toBeGreaterThanOrEqual(100);
            expect(progress.isComplete).toBe(true);
        });

        it('should handle just started fast', () => {
            const progress = fastingService.calculateFastingProgress({
                fastStartTime: new Date(),
                targetFastingHours: 16
            });

            expect(progress.hoursElapsed).toBeLessThan(1);
            expect(progress.percentComplete).toBeLessThan(10);
        });
    });

    describe('getProtocolInfo', () => {
        it('should return info for 16:8', () => {
            const info = fastingService.getProtocolInfo('16:8');

            expect(info.name).toBe('16:8');
            expect(info.fastingHours).toBe(16);
            expect(info.eatingHours).toBe(8);
            expect(info.difficulty).toBeDefined();
        });

        it('should return info for OMAD', () => {
            const info = fastingService.getProtocolInfo('OMAD');

            expect(info.name).toBe('OMAD');
            expect(info.fastingHours).toBe(23);
            expect(info.difficulty).toBe('advanced');
        });

        it('should handle unknown protocol', () => {
            const info = fastingService.getProtocolInfo('unknown');

            expect(info).toBeNull();
        });
    });

    describe('shouldBreakFast', () => {
        it('should recommend breaking fast after target hours', () => {
            const shouldBreak = fastingService.shouldBreakFast({
                hoursElapsed: 17,
                targetHours: 16
            });

            expect(shouldBreak).toBe(true);
        });

        it('should not recommend breaking fast early', () => {
            const shouldBreak = fastingService.shouldBreakFast({
                hoursElapsed: 14,
                targetHours: 16
            });

            expect(shouldBreak).toBe(false);
        });

        it('should consider circadian timing', () => {
            const shouldBreak = fastingService.shouldBreakFast({
                hoursElapsed: 16,
                targetHours: 16,
                currentTime: 22 // 10 PM - late for eating
            });

            expect(shouldBreak).toBe(false);
        });
    });

    describe('getAutophagyPhase', () => {
        it('should return early phase for short fasts', () => {
            const phase = fastingService.getAutophagyPhase(12);

            expect(phase).toBe('early');
        });

        it('should return peak phase for longer fasts', () => {
            const phase = fastingService.getAutophagyPhase(18);

            expect(phase).toBe('peak');
        });

        it('should return deep phase for extended fasts', () => {
            const phase = fastingService.getAutophagyPhase(24);

            expect(phase).toBe('deep');
        });
    });
});
