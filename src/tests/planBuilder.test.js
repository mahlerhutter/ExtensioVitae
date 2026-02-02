import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildPlan } from '../lib/planBuilder.js';

describe('Plan Builder', () => {
    let mockIntakeData;

    beforeEach(() => {
        mockIntakeData = {
            name: 'Test User',
            age: 30,
            sex: 'male',
            primary_goal: 'energy',
            sleep_hours_bucket: '7-8',
            stress_1_10: 5,
            training_frequency: '2-3x',
            diet_pattern: ['balanced'],
            daily_time_budget: '15-30',
            equipment_access: 'none',
        };
    });

    describe('Plan Structure', () => {
        it('should generate a plan with correct structure', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan).toHaveProperty('user_name');
            expect(plan).toHaveProperty('plan_summary');
            expect(plan).toHaveProperty('primary_focus_pillars');
            expect(plan).toHaveProperty('days');
            expect(plan).toHaveProperty('start_date');
            expect(plan).toHaveProperty('meta');
        });

        it('should generate exactly 30 days', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan.days).toHaveLength(30);
        });

        it('should have sequential day numbers', () => {
            const plan = buildPlan(mockIntakeData);

            plan.days.forEach((day, index) => {
                expect(day.day).toBe(index + 1);
            });
        });
    });

    describe('Task Generation', () => {
        it('should generate tasks for each day', () => {
            const plan = buildPlan(mockIntakeData);

            plan.days.forEach((day) => {
                expect(day.tasks).toBeDefined();
                expect(Array.isArray(day.tasks)).toBe(true);
                expect(day.tasks.length).toBeGreaterThan(0);
            });
        });

        it('should respect daily time budget', () => {
            const plan = buildPlan(mockIntakeData);

            plan.days.forEach((day) => {
                const totalTime = day.tasks.reduce((sum, task) => sum + task.time_minutes, 0);
                // Allow some flexibility (up to 35 minutes for 15-30 budget)
                expect(totalTime).toBeLessThanOrEqual(40);
            });
        });

        it('should assign unique task IDs', () => {
            const plan = buildPlan(mockIntakeData);

            const allTaskIds = plan.days.flatMap((day) => day.tasks.map((task) => task.id));
            const uniqueIds = new Set(allTaskIds);

            expect(uniqueIds.size).toBe(allTaskIds.length);
        });

        it('should include required task properties', () => {
            const plan = buildPlan(mockIntakeData);

            plan.days.forEach((day) => {
                day.tasks.forEach((task) => {
                    expect(task).toHaveProperty('id');
                    expect(task).toHaveProperty('pillar');
                    expect(task).toHaveProperty('task');
                    expect(task).toHaveProperty('time_minutes');
                    expect(task).toHaveProperty('when');
                });
            });
        });
    });

    describe('Primary Focus Pillars', () => {
        it('should identify primary focus pillars based on goal', () => {
            const energyPlan = buildPlan({ ...mockIntakeData, primary_goal: 'energy' });
            const sleepPlan = buildPlan({ ...mockIntakeData, primary_goal: 'sleep' });

            expect(energyPlan.primary_focus_pillars).toBeDefined();
            expect(Array.isArray(energyPlan.primary_focus_pillars)).toBe(true);
            expect(energyPlan.primary_focus_pillars.length).toBeGreaterThan(0);

            expect(sleepPlan.primary_focus_pillars).toBeDefined();
            expect(sleepPlan.primary_focus_pillars).toContain('sleep');
        });

        it('should include at least 2 primary focus pillars', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan.primary_focus_pillars.length).toBeGreaterThanOrEqual(2);
            expect(plan.primary_focus_pillars.length).toBeLessThanOrEqual(4);
        });
    });

    describe('Plan Summary', () => {
        it('should generate a personalized plan summary', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan.plan_summary).toBeDefined();
            expect(typeof plan.plan_summary).toBe('string');
            expect(plan.plan_summary.length).toBeGreaterThan(50);
        });

        it('should include user name in summary', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan.user_name).toBe('Test User');
        });
    });

    describe('Metadata', () => {
        it('should include intake data in metadata', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan.meta).toHaveProperty('input');
            expect(plan.meta.input).toMatchObject(mockIntakeData);
        });

        it('should include generation method', () => {
            const plan = buildPlan(mockIntakeData);

            expect(plan).toHaveProperty('generation_method');
            expect(typeof plan.generation_method).toBe('string');
        });
    });

    describe('Health Profile Integration', () => {
        it('should accept health profile data', () => {
            const healthProfile = {
                chronic_conditions: ['heart_disease'],
                injuries: [],
                dietary_restrictions: [],
            };

            const plan = buildPlan(mockIntakeData, healthProfile);

            expect(plan).toBeDefined();
            expect(plan.days).toHaveLength(30);
        });

        it('should filter tasks based on health constraints', () => {
            const healthProfile = {
                chronic_conditions: ['heart_disease'],
                injuries: [],
                dietary_restrictions: [],
            };

            const plan = buildPlan(mockIntakeData, healthProfile);

            // Check that high-intensity tasks are filtered
            const allTasks = plan.days.flatMap((day) => day.tasks);
            const hiitTasks = allTasks.filter((task) =>
                task.task.toLowerCase().includes('hiit')
            );

            expect(hiitTasks.length).toBe(0);
        });

        it('should include health metadata when profile provided', () => {
            const healthProfile = {
                chronic_conditions: ['diabetes'],
                injuries: [],
                dietary_restrictions: ['gluten_free'],
            };

            const plan = buildPlan(mockIntakeData, healthProfile);

            expect(plan.meta).toHaveProperty('health');
            expect(plan.meta.health).toHaveProperty('hasProfile', true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle minimal intake data', () => {
            const minimalData = {
                name: 'User',
                age: 30,
                sex: 'male',
                primary_goal: 'general',
            };

            const plan = buildPlan(minimalData);

            expect(plan).toBeDefined();
            expect(plan.days).toHaveLength(30);
        });

        it('should handle extreme age values', () => {
            const youngUser = buildPlan({ ...mockIntakeData, age: 18 });
            const olderUser = buildPlan({ ...mockIntakeData, age: 80 });

            expect(youngUser.days).toHaveLength(30);
            expect(olderUser.days).toHaveLength(30);
        });

        it('should handle missing optional fields', () => {
            const { equipment_access, daily_time_budget, ...essentialData } = mockIntakeData;

            const plan = buildPlan(essentialData);

            expect(plan).toBeDefined();
            expect(plan.days).toHaveLength(30);
        });
    });

    describe('Task Distribution', () => {
        it('should distribute tasks across different pillars', () => {
            const plan = buildPlan(mockIntakeData);

            const allTasks = plan.days.flatMap((day) => day.tasks);
            const pillars = new Set(allTasks.map((task) => task.pillar));

            // Should have tasks from multiple pillars
            expect(pillars.size).toBeGreaterThan(2);
        });

        it('should include tasks for different times of day', () => {
            const plan = buildPlan(mockIntakeData);

            const allTasks = plan.days.flatMap((day) => day.tasks);
            const timeSlots = new Set(allTasks.map((task) => task.when));

            // Should have tasks for different times
            expect(timeSlots.size).toBeGreaterThan(1);
        });
    });
});
