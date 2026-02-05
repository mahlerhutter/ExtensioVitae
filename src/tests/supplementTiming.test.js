import { describe, it, expect } from 'vitest';
import supplementService from '../lib/supplementTiming';

describe('Supplement Timing Service', () => {
    describe('getOptimalTiming', () => {
        it('should recommend morning for Vitamin D', () => {
            const timing = supplementService.getOptimalTiming('vitamin_d');

            expect(timing.timeOfDay).toBe('morning');
            expect(timing.withFood).toBe(true);
        });

        it('should recommend evening for Magnesium', () => {
            const timing = supplementService.getOptimalTiming('magnesium');

            expect(timing.timeOfDay).toBe('evening');
        });

        it('should recommend morning for Caffeine', () => {
            const timing = supplementService.getOptimalTiming('caffeine');

            expect(timing.timeOfDay).toBe('morning');
            expect(timing.cutoffTime).toBeDefined();
        });

        it('should handle unknown supplements', () => {
            const timing = supplementService.getOptimalTiming('unknown_supplement');

            expect(timing).toBeDefined();
            expect(timing.timeOfDay).toBe('any');
        });

        it('should include reasoning', () => {
            const timing = supplementService.getOptimalTiming('vitamin_d');

            expect(timing.reason).toBeDefined();
            expect(timing.reason.length).toBeGreaterThan(0);
        });
    });

    describe('checkConflicts', () => {
        it('should detect caffeine + sleep conflict', () => {
            const supplements = [
                { name: 'caffeine', time: '20:00' },
                { name: 'melatonin', time: '22:00' }
            ];

            const conflicts = supplementService.checkConflicts(supplements);

            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts[0].type).toBe('timing_conflict');
        });

        it('should detect absorption conflicts', () => {
            const supplements = [
                { name: 'calcium', time: '08:00' },
                { name: 'iron', time: '08:00' }
            ];

            const conflicts = supplementService.checkConflicts(supplements);

            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts[0].type).toBe('absorption_conflict');
        });

        it('should not detect conflicts for compatible supplements', () => {
            const supplements = [
                { name: 'vitamin_d', time: '08:00' },
                { name: 'omega_3', time: '08:00' }
            ];

            const conflicts = supplementService.checkConflicts(supplements);

            expect(conflicts.length).toBe(0);
        });

        it('should handle empty array', () => {
            const conflicts = supplementService.checkConflicts([]);

            expect(conflicts).toEqual([]);
        });
    });

    describe('generateSchedule', () => {
        it('should create schedule for multiple supplements', () => {
            const supplements = [
                'vitamin_d',
                'magnesium',
                'omega_3'
            ];

            const schedule = supplementService.generateSchedule(supplements);

            expect(schedule.morning.length).toBeGreaterThan(0);
            expect(schedule.evening.length).toBeGreaterThan(0);
        });

        it('should group by time of day', () => {
            const supplements = [
                'vitamin_d',
                'vitamin_c',
                'magnesium'
            ];

            const schedule = supplementService.generateSchedule(supplements);

            expect(schedule.morning).toContain('vitamin_d');
            expect(schedule.evening).toContain('magnesium');
        });

        it('should handle single supplement', () => {
            const supplements = ['vitamin_d'];

            const schedule = supplementService.generateSchedule(supplements);

            expect(schedule.morning).toContain('vitamin_d');
        });

        it('should include timing details', () => {
            const supplements = ['vitamin_d'];

            const schedule = supplementService.generateSchedule(supplements, { includeDetails: true });

            expect(schedule.morning[0].withFood).toBeDefined();
            expect(schedule.morning[0].reason).toBeDefined();
        });
    });

    describe('shouldTakeWithFood', () => {
        it('should recommend food for fat-soluble vitamins', () => {
            const withFood = supplementService.shouldTakeWithFood('vitamin_d');

            expect(withFood).toBe(true);
        });

        it('should recommend empty stomach for some supplements', () => {
            const withFood = supplementService.shouldTakeWithFood('l_theanine');

            expect(withFood).toBe(false);
        });
    });

    describe('getCutoffTime', () => {
        it('should have cutoff for stimulants', () => {
            const cutoff = supplementService.getCutoffTime('caffeine');

            expect(cutoff).toBeDefined();
            expect(cutoff).toBeLessThan(18); // Before 6 PM
        });

        it('should not have cutoff for non-stimulants', () => {
            const cutoff = supplementService.getCutoffTime('vitamin_d');

            expect(cutoff).toBeNull();
        });
    });
});
