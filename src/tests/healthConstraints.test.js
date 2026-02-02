import { describe, it, expect } from 'vitest';
import {
    getHealthConstraints,
    filterTasksByHealth,
    getIntensityCap,
} from '../lib/healthConstraints.js';

describe('Health Constraints', () => {
    describe('getHealthConstraints', () => {
        it('should return constraints for heart disease', () => {
            const profile = {
                chronic_conditions: ['heart_disease'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints).toHaveProperty('excludedTasks');
            expect(constraints).toHaveProperty('intensityCap');
            expect(constraints).toHaveProperty('warnings');
            expect(constraints.excludedTasks).toContain('HIIT');
            expect(constraints.intensityCap).toBe(1); // Moderate
        });

        it('should return constraints for diabetes', () => {
            const profile = {
                chronic_conditions: ['diabetes'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.excludedTasks).toContain('Fasting');
            expect(constraints.warnings.length).toBeGreaterThan(0);
        });

        it('should return constraints for pregnancy', () => {
            const profile = {
                chronic_conditions: ['pregnancy'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.excludedTasks).toContain('Heavy Lifting');
            expect(constraints.intensityCap).toBe(1); // Moderate
        });

        it('should combine constraints for multiple conditions', () => {
            const profile = {
                chronic_conditions: ['heart_disease', 'diabetes'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.excludedTasks).toContain('HIIT');
            expect(constraints.excludedTasks).toContain('Fasting');
            expect(constraints.warnings.length).toBeGreaterThan(1);
        });

        it('should handle injury constraints', () => {
            const profile = {
                chronic_conditions: [],
                injuries: ['knee'],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.excludedTasks).toContain('Running');
            expect(constraints.excludedTasks).toContain('Squats');
        });

        it('should return empty constraints for healthy profile', () => {
            const profile = {
                chronic_conditions: [],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.excludedTasks).toHaveLength(0);
            expect(constraints.intensityCap).toBeNull();
            expect(constraints.warnings).toHaveLength(0);
        });
    });

    describe('filterTasksByHealth', () => {
        it('should filter out excluded tasks', () => {
            const tasks = [
                { id: 't1', task: 'HIIT workout', pillar: 'movement' },
                { id: 't2', task: 'Walking', pillar: 'movement' },
                { id: 't3', task: 'Meditation', pillar: 'stress' },
            ];

            const constraints = {
                excludedTasks: ['HIIT'],
                intensityCap: null,
                warnings: [],
            };

            const filtered = filterTasksByHealth(tasks, constraints);

            expect(filtered).toHaveLength(2);
            expect(filtered.find((t) => t.id === 't1')).toBeUndefined();
            expect(filtered.find((t) => t.id === 't2')).toBeDefined();
        });

        it('should filter tasks by intensity cap', () => {
            const tasks = [
                { id: 't1', task: 'HIIT', pillar: 'movement', intensity: 2 },
                { id: 't2', task: 'Jogging', pillar: 'movement', intensity: 1 },
                { id: 't3', task: 'Walking', pillar: 'movement', intensity: 0 },
            ];

            const constraints = {
                excludedTasks: [],
                intensityCap: 1, // Moderate
                warnings: [],
            };

            const filtered = filterTasksByHealth(tasks, constraints);

            // Should exclude HIIT (intensity 2) but keep Jogging and Walking
            expect(filtered.length).toBeLessThanOrEqual(2);
            expect(filtered.find((t) => t.intensity === 2)).toBeUndefined();
        });

        it('should return all tasks when no constraints', () => {
            const tasks = [
                { id: 't1', task: 'HIIT', pillar: 'movement' },
                { id: 't2', task: 'Walking', pillar: 'movement' },
                { id: 't3', task: 'Meditation', pillar: 'stress' },
            ];

            const constraints = {
                excludedTasks: [],
                intensityCap: null,
                warnings: [],
            };

            const filtered = filterTasksByHealth(tasks, constraints);

            expect(filtered).toHaveLength(3);
        });

        it('should handle empty task list', () => {
            const tasks = [];
            const constraints = {
                excludedTasks: ['HIIT'],
                intensityCap: 1,
                warnings: [],
            };

            const filtered = filterTasksByHealth(tasks, constraints);

            expect(filtered).toHaveLength(0);
        });
    });

    describe('getIntensityCap', () => {
        it('should return Moderate cap for heart disease', () => {
            const profile = {
                chronic_conditions: ['heart_disease'],
                injuries: [],
                dietary_restrictions: [],
            };

            const cap = getIntensityCap(profile);

            expect(cap).toBe(1); // Moderate
        });

        it('should return Gentle cap for severe arthritis', () => {
            const profile = {
                chronic_conditions: ['arthritis'],
                injuries: [],
                dietary_restrictions: [],
            };

            const cap = getIntensityCap(profile);

            expect(cap).toBe(0); // Gentle
        });

        it('should return null for healthy profile', () => {
            const profile = {
                chronic_conditions: [],
                injuries: [],
                dietary_restrictions: [],
            };

            const cap = getIntensityCap(profile);

            expect(cap).toBeNull();
        });

        it('should return strictest cap for multiple conditions', () => {
            const profile = {
                chronic_conditions: ['heart_disease', 'arthritis'],
                injuries: [],
                dietary_restrictions: [],
            };

            const cap = getIntensityCap(profile);

            // Should return the most restrictive (Gentle = 0)
            expect(cap).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle null profile gracefully', () => {
            const constraints = getHealthConstraints(null);

            expect(constraints.excludedTasks).toHaveLength(0);
            expect(constraints.intensityCap).toBeNull();
        });

        it('should handle undefined profile gracefully', () => {
            const constraints = getHealthConstraints(undefined);

            expect(constraints.excludedTasks).toHaveLength(0);
            expect(constraints.intensityCap).toBeNull();
        });

        it('should handle profile with missing fields', () => {
            const profile = {
                chronic_conditions: ['diabetes'],
                // Missing injuries and dietary_restrictions
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints).toBeDefined();
            expect(constraints.excludedTasks).toBeDefined();
        });

        it('should handle unknown condition gracefully', () => {
            const profile = {
                chronic_conditions: ['unknown_condition'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints).toBeDefined();
            // Should not crash, might have generic warnings
        });
    });

    describe('Dietary Restrictions', () => {
        it('should handle gluten-free restriction', () => {
            const profile = {
                chronic_conditions: [],
                injuries: [],
                dietary_restrictions: ['gluten_free'],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints).toBeDefined();
            // Dietary restrictions might not exclude tasks but could add warnings
        });

        it('should handle multiple dietary restrictions', () => {
            const profile = {
                chronic_conditions: [],
                injuries: [],
                dietary_restrictions: ['vegan', 'gluten_free'],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints).toBeDefined();
        });
    });

    describe('Warning Generation', () => {
        it('should generate warnings for chronic conditions', () => {
            const profile = {
                chronic_conditions: ['heart_disease'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            expect(constraints.warnings).toBeDefined();
            expect(Array.isArray(constraints.warnings)).toBe(true);
            expect(constraints.warnings.length).toBeGreaterThan(0);
        });

        it('should include general safety warning', () => {
            const profile = {
                chronic_conditions: ['diabetes'],
                injuries: [],
                dietary_restrictions: [],
            };

            const constraints = getHealthConstraints(profile);

            const hasGeneralWarning = constraints.warnings.some((w) =>
                w.toLowerCase().includes('consult') || w.toLowerCase().includes('doctor')
            );

            expect(hasGeneralWarning).toBe(true);
        });
    });
});
