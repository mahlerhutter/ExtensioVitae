/**
 * Health Profile Integration Test Suite
 * 
 * Tests the health-aware plan generation with various health conditions
 * to ensure proper task filtering, intensity capping, and metadata logging.
 */

import { build30DayBlueprint } from '../lib/planBuilder.js';
import {
    filterTasksByHealth,
    calculateIntensityCap,
    generateHealthWarnings,
    shouldExcludeTask
} from '../lib/healthConstraints.js';

// Mock task library with various tags
const MOCK_TASKS = [
    { id: 'hiit_1', pillar: 'movement_muscle', tags: ['hiit', 'intense'], intensity: 1, minutes: 15, when: 'am', equipment: 'none' },
    { id: 'heavy_lift_1', pillar: 'movement_muscle', tags: ['heavy_lifting', 'strength'], intensity: 1, minutes: 20, when: 'am', equipment: 'gym' },
    { id: 'running_1', pillar: 'movement_muscle', tags: ['running', 'cardio'], intensity: 0, minutes: 20, when: 'am', equipment: 'none' },
    { id: 'gentle_walk_1', pillar: 'movement_muscle', tags: ['gentle', 'light_walk'], intensity: 0, minutes: 15, when: 'any', equipment: 'none' },
    { id: 'zone2_cardio_1', pillar: 'movement_muscle', tags: ['zone2', 'light_cardio'], intensity: 0, minutes: 20, when: 'am', equipment: 'none' },
    { id: 'breathing_1', pillar: 'mental_resilience', tags: ['breathing', 'mindfulness'], intensity: 0, minutes: 10, when: 'any', equipment: 'none' },
    { id: 'meditation_1', pillar: 'mental_resilience', tags: ['meditation', 'mindfulness'], intensity: 0, minutes: 15, when: 'pm', equipment: 'none' },
    { id: 'deep_squat_1', pillar: 'movement_muscle', tags: ['deep_squats', 'strength'], intensity: 0, minutes: 10, when: 'am', equipment: 'none' },
    { id: 'mobility_1', pillar: 'movement_muscle', tags: ['mobility', 'stretching'], intensity: 0, minutes: 10, when: 'any', equipment: 'none' },
    { id: 'cold_shower_1', pillar: 'circadian_rhythm', tags: ['cold_exposure'], intensity: 0, minutes: 5, when: 'am', equipment: 'none' },
    { id: 'fasting_1', pillar: 'nutrition_metabolism', tags: ['fasting'], intensity: 0, minutes: 0, when: 'any', equipment: 'none' },
    { id: 'protein_meal_1', pillar: 'nutrition_metabolism', tags: ['protein', 'meal_prep'], intensity: 0, minutes: 15, when: 'any', equipment: 'none' },
    { id: 'sleep_routine_1', pillar: 'sleep_recovery', tags: ['sleep', 'winddown'], intensity: 0, minutes: 10, when: 'pm', equipment: 'none' },
];

// Standard intake data
const BASE_INTAKE = {
    name: 'Test User',
    age: 35,
    sex: 'male',
    primary_goal: 'energy',
    sleep_hours_bucket: '7-7.5',
    stress_1_10: 5,
    training_frequency: '3-4',
    diet_pattern: ['mostly_whole_foods'],
    daily_time_budget: '20',
    equipment_access: 'none',
    phone_number: '+1234567890',
    whatsapp_consent: true
};

// Test scenarios
const TEST_SCENARIOS = [
    {
        name: 'Scenario 1: Heart Disease (Gentle Cap)',
        healthProfile: {
            chronic_conditions: ['heart_disease'],
            injuries_limitations: [],
            dietary_restrictions: [],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 0,
        expectedExclusions: ['hiit_1', 'heavy_lift_1', 'cold_shower_1'],
        expectedWarnings: true
    },
    {
        name: 'Scenario 2: Diabetes Type 1 (Moderate Cap)',
        healthProfile: {
            chronic_conditions: ['diabetes_type1'],
            injuries_limitations: [],
            dietary_restrictions: [],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['fasting_1'],
        expectedWarnings: true
    },
    {
        name: 'Scenario 3: Knee Issues + Arthritis',
        healthProfile: {
            chronic_conditions: ['arthritis'],
            injuries_limitations: ['knee_issues'],
            dietary_restrictions: [],
            takes_medications: false,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['running_1', 'deep_squat_1'],
        expectedPreferences: ['mobility_1', 'gentle_walk_1']
    },
    {
        name: 'Scenario 4: Pregnancy',
        healthProfile: {
            chronic_conditions: [],
            injuries_limitations: ['pregnancy'],
            dietary_restrictions: [],
            takes_medications: false,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['hiit_1', 'heavy_lift_1'],
        expectedWarnings: true
    },
    {
        name: 'Scenario 5: Asthma + Smoking',
        healthProfile: {
            chronic_conditions: ['asthma'],
            injuries_limitations: [],
            dietary_restrictions: [],
            takes_medications: true,
            is_smoker: true,
            smoking_frequency: 'daily'
        },
        expectedIntensityCap: null,
        expectedExclusions: ['cold_shower_1'],
        expectedPreferences: ['breathing_1']
    },
    {
        name: 'Scenario 6: Multiple Conditions (3+)',
        healthProfile: {
            chronic_conditions: ['hypertension', 'diabetes_type2', 'arthritis'],
            injuries_limitations: ['back_pain'],
            dietary_restrictions: [],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['hiit_1', 'heavy_lift_1', 'running_1'],
        expectedWarnings: true,
        expectedWarningCount: 2 // Multiple conditions warning + medication warning
    },
    {
        name: 'Scenario 7: No Health Issues (Baseline)',
        healthProfile: null,
        expectedIntensityCap: null,
        expectedExclusions: [],
        expectedWarnings: false
    }
];

// Test runner
function runHealthProfileTests() {
    console.log('🧪 Starting Health Profile Integration Tests...\n');
    console.log('='.repeat(80));

    const results = {
        passed: 0,
        failed: 0,
        details: []
    };

    TEST_SCENARIOS.forEach((scenario, index) => {
        console.log(`\n📋 ${scenario.name}`);
        console.log('-'.repeat(80));

        const testResult = {
            scenario: scenario.name,
            tests: [],
            passed: true
        };

        try {
            // Test 1: Intensity Cap Calculation
            const actualIntensityCap = calculateIntensityCap(scenario.healthProfile);
            const intensityCapPass = actualIntensityCap === scenario.expectedIntensityCap;
            testResult.tests.push({
                name: 'Intensity Cap',
                expected: scenario.expectedIntensityCap,
                actual: actualIntensityCap,
                passed: intensityCapPass
            });
            console.log(`  ✓ Intensity Cap: ${actualIntensityCap === null ? 'No restriction' : actualIntensityCap} ${intensityCapPass ? '✅' : '❌'}`);

            // Test 2: Task Filtering
            const filteredTasks = filterTasksByHealth(MOCK_TASKS, scenario.healthProfile);
            const filteredTaskIds = filteredTasks.map(t => t.id);
            const excludedTaskIds = MOCK_TASKS.filter(t => !filteredTaskIds.includes(t.id)).map(t => t.id);

            const expectedExcluded = scenario.expectedExclusions || [];
            const allExpectedExcluded = expectedExcluded.every(id => excludedTaskIds.includes(id));
            const noUnexpectedExclusions = excludedTaskIds.every(id => expectedExcluded.includes(id) || scenario.healthProfile === null);

            testResult.tests.push({
                name: 'Task Filtering',
                expected: expectedExcluded,
                actual: excludedTaskIds,
                passed: allExpectedExcluded
            });
            console.log(`  ✓ Excluded Tasks: ${excludedTaskIds.length > 0 ? excludedTaskIds.join(', ') : 'None'} ${allExpectedExcluded ? '✅' : '❌'}`);
            console.log(`    Expected: ${expectedExcluded.length > 0 ? expectedExcluded.join(', ') : 'None'}`);

            // Test 3: Health Warnings Generation
            const warnings = generateHealthWarnings(scenario.healthProfile);
            const hasWarnings = warnings.length > 0;
            const warningsPass = scenario.expectedWarnings ? hasWarnings : !hasWarnings;

            if (scenario.expectedWarningCount) {
                const warningCountPass = warnings.length >= scenario.expectedWarningCount;
                testResult.tests.push({
                    name: 'Warning Count',
                    expected: `>= ${scenario.expectedWarningCount}`,
                    actual: warnings.length,
                    passed: warningCountPass
                });
                console.log(`  ✓ Warnings Generated: ${warnings.length} ${warningCountPass ? '✅' : '❌'}`);
            } else {
                testResult.tests.push({
                    name: 'Warnings Present',
                    expected: scenario.expectedWarnings,
                    actual: hasWarnings,
                    passed: warningsPass
                });
                console.log(`  ✓ Warnings: ${hasWarnings ? 'Yes' : 'No'} ${warningsPass ? '✅' : '❌'}`);
            }

            if (warnings.length > 0) {
                console.log(`    Warnings: ${warnings.join('; ')}`);
            }

            // Test 4: Full Plan Generation
            console.log(`  ⏳ Generating 30-day plan...`);
            const plan = build30DayBlueprint(BASE_INTAKE, MOCK_TASKS, {}, scenario.healthProfile);

            // Verify plan metadata includes health info
            const hasHealthMeta = plan.meta && plan.meta.health;
            const healthMetaCorrect = hasHealthMeta &&
                plan.meta.health.hasProfile === (scenario.healthProfile !== null);

            testResult.tests.push({
                name: 'Plan Metadata',
                expected: 'Health metadata present',
                actual: hasHealthMeta ? 'Present' : 'Missing',
                passed: healthMetaCorrect
            });
            console.log(`  ✓ Plan Generated: ${plan.days.length} days ${healthMetaCorrect ? '✅' : '❌'}`);

            if (hasHealthMeta) {
                console.log(`    Health Profile: ${plan.meta.health.hasProfile ? 'Active' : 'None'}`);
                if (plan.meta.health.intensityCap !== undefined) {
                    console.log(`    Intensity Cap: ${plan.meta.health.intensityCap}`);
                }
                if (plan.meta.health.tasksFiltered) {
                    console.log(`    Tasks Filtered: ${plan.meta.health.tasksFiltered}`);
                }
                if (plan.meta.health.warnings && plan.meta.health.warnings.length > 0) {
                    console.log(`    Warnings: ${plan.meta.health.warnings.length}`);
                }
            }

            // Check if any excluded tasks appear in the plan
            const planTaskIds = plan.days.flatMap(day => day.tasks.map(t => t.id));
            const unexpectedTasks = planTaskIds.filter(id => expectedExcluded.includes(id));
            const noUnexpectedTasksInPlan = unexpectedTasks.length === 0;

            testResult.tests.push({
                name: 'No Excluded Tasks in Plan',
                expected: 'None',
                actual: unexpectedTasks.length > 0 ? unexpectedTasks.join(', ') : 'None',
                passed: noUnexpectedTasksInPlan
            });
            console.log(`  ✓ Excluded Tasks in Plan: ${unexpectedTasks.length === 0 ? 'None' : unexpectedTasks.join(', ')} ${noUnexpectedTasksInPlan ? '✅' : '❌'}`);

            // Overall scenario result
            const allTestsPassed = testResult.tests.every(t => t.passed);
            testResult.passed = allTestsPassed;

            if (allTestsPassed) {
                results.passed++;
                console.log(`\n  ✅ SCENARIO PASSED`);
            } else {
                results.failed++;
                testResult.passed = false;
                console.log(`\n  ❌ SCENARIO FAILED`);
            }

        } catch (error) {
            console.error(`  ❌ ERROR: ${error.message}`);
            console.error(error.stack);
            testResult.passed = false;
            testResult.error = error.message;
            results.failed++;
        }

        results.details.push(testResult);
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Scenarios: ${TEST_SCENARIOS.length}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Success Rate: ${((results.passed / TEST_SCENARIOS.length) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\n❌ FAILED SCENARIOS:');
        results.details.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.scenario}`);
            r.tests.filter(t => !t.passed).forEach(t => {
                console.log(`    • ${t.name}: Expected ${JSON.stringify(t.expected)}, Got ${JSON.stringify(t.actual)}`);
            });
        });
    }

    console.log('\n' + '='.repeat(80));

    return results;
}

// Export for use in other test files
export { runHealthProfileTests, TEST_SCENARIOS, MOCK_TASKS };

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runHealthProfileTests();
}
