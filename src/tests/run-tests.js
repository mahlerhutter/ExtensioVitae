#!/usr/bin/env node

/**
 * Enhanced Test Runner with Better UI
 * Runs tests and displays results in a formatted way
 */

import { calculateLongevityScore } from '../lib/longevityScore.js';
import { buildPlan } from '../lib/planBuilder.js';
import { getHealthConstraints, filterTasksByHealth } from '../lib/healthConstraints.js';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestDetails = [];

function describe(suiteName, fn) {
    console.log(`\n${colors.cyan}${colors.bright}${suiteName}${colors.reset}`);
    fn();
}

function it(testName, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
    } catch (error) {
        failedTests++;
        console.log(`  ${colors.red}✗${colors.reset} ${testName}`);
        failedTestDetails.push({ test: testName, error: error.message });
    }
}

function expect(value) {
    return {
        toBe(expected) {
            if (value !== expected) {
                throw new Error(`Expected ${expected} but got ${value}`);
            }
        },
        toBeGreaterThan(expected) {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (value >= expected) {
                throw new Error(`Expected ${value} to be less than ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected) {
            if (value > expected) {
                throw new Error(`Expected ${value} to be less than or equal to ${expected}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in value)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toHaveLength(expected) {
            if (value.length !== expected) {
                throw new Error(`Expected length ${expected} but got ${value.length}`);
            }
        },
        toContain(item) {
            if (!value.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
    };
}

// ============================================
// LONGEVITY SCORE TESTS
// ============================================

describe('📊 Longevity Score Calculation', () => {
    it('calculates baseline score for optimal health', () => {
        const result = calculateLongevityScore({
            age: 30,
            sex: 'male',
            sleep_hours_bucket: '7-8',
            stress_1_10: 3,
            training_frequency: '4-5x',
            diet_pattern: ['whole_foods'],
        });

        expect(result).toHaveProperty('score');
        expect(result.score).toBeGreaterThan(70);
        expect(result.score).toBeLessThanOrEqual(100);
    });

    it('calculates lower score for poor health habits', () => {
        const result = calculateLongevityScore({
            age: 50,
            sex: 'female',
            sleep_hours_bucket: '<5',
            stress_1_10: 9,
            training_frequency: 'none',
            diet_pattern: ['processed_foods'],
        });

        expect(result.score).toBeLessThan(60);
    });

    it('handles missing optional fields', () => {
        const result = calculateLongevityScore({
            age: 30,
            sex: 'male',
        });

        expect(result).toHaveProperty('score');
        expect(result.score).toBeGreaterThan(0);
    });

    it('penalizes insufficient sleep', () => {
        const poorSleep = calculateLongevityScore({
            age: 30,
            sex: 'male',
            sleep_hours_bucket: '<5',
            stress_1_10: 5,
            training_frequency: '2-3x',
            diet_pattern: ['balanced'],
        });

        const goodSleep = calculateLongevityScore({
            age: 30,
            sex: 'male',
            sleep_hours_bucket: '7-8',
            stress_1_10: 5,
            training_frequency: '2-3x',
            diet_pattern: ['balanced'],
        });

        expect(poorSleep.score).toBeLessThan(goodSleep.score);
    });
});

// ============================================
// PLAN BUILDER TESTS
// ============================================

describe('🗓️  Plan Builder', () => {
    it('generates exactly 30 days', () => {
        const plan = buildPlan({
            name: 'Test User',
            age: 30,
            sex: 'male',
            primary_goal: 'energy',
        });

        expect(plan.days).toHaveLength(30);
    });

    it('generates tasks for each day', () => {
        const plan = buildPlan({
            name: 'Test User',
            age: 30,
            sex: 'male',
            primary_goal: 'energy',
        });

        plan.days.forEach((day) => {
            expect(day.tasks.length).toBeGreaterThan(0);
        });
    });

    it('includes required plan properties', () => {
        const plan = buildPlan({
            name: 'Test User',
            age: 30,
            sex: 'male',
            primary_goal: 'energy',
        });

        expect(plan).toHaveProperty('user_name');
        expect(plan).toHaveProperty('plan_summary');
        expect(plan).toHaveProperty('primary_focus_pillars');
        expect(plan).toHaveProperty('days');
    });

    it('filters tasks based on health constraints', () => {
        const healthProfile = {
            chronic_conditions: ['heart_disease'],
            injuries: [],
            dietary_restrictions: [],
        };

        const plan = buildPlan(
            {
                name: 'Test User',
                age: 60,
                sex: 'male',
                primary_goal: 'longevity',
            },
            healthProfile
        );

        const allTasks = plan.days.flatMap((day) => day.tasks);
        const hiitTasks = allTasks.filter((task) =>
            task.task.toLowerCase().includes('hiit')
        );

        expect(hiitTasks).toHaveLength(0);
    });
});

// ============================================
// HEALTH CONSTRAINTS TESTS
// ============================================

describe('🏥 Health Constraints', () => {
    it('returns constraints for heart disease', () => {
        const constraints = getHealthConstraints({
            chronic_conditions: ['heart_disease'],
            injuries: [],
            dietary_restrictions: [],
        });

        expect(constraints.excludedTasks).toContain('HIIT');
    });

    it('filters out excluded tasks', () => {
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
    });

    it('handles empty profile gracefully', () => {
        const constraints = getHealthConstraints({
            chronic_conditions: [],
            injuries: [],
            dietary_restrictions: [],
        });

        expect(constraints.excludedTasks).toHaveLength(0);
    });
});

// ============================================
// SUMMARY
// ============================================

console.log(`\n${'='.repeat(50)}`);
console.log(`${colors.bright}Test Summary${colors.reset}`);
console.log(`${'='.repeat(50)}`);
console.log(`Total Tests:  ${totalTests}`);
console.log(`${colors.green}Passed:       ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed:       ${failedTests}${colors.reset}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    failedTestDetails.forEach(({ test, error }) => {
        console.log(`  ${colors.red}✗${colors.reset} ${test}`);
        console.log(`    ${colors.yellow}${error}${colors.reset}`);
    });
}

console.log(`\n${'='.repeat(50)}\n`);

process.exit(failedTests > 0 ? 1 : 0);
