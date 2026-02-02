/**
 * Health Profile Integration Test Suite (Standalone)
 * 
 * Tests health constraints logic directly without full plan generation
 */

// Mock CHRONIC_CONDITIONS and INJURIES_LIMITATIONS
const CHRONIC_CONDITIONS = {
    heart_disease: { label: 'Heart Disease', planImpact: { warnings: ['Konsultieren Sie vor Trainingsänderungen Ihren Arzt'] } },
    diabetes_type1: { label: 'Diabetes Type 1', planImpact: { warnings: ['Blutzucker vor/nach Training kontrollieren'] } },
    diabetes_type2: { label: 'Diabetes Type 2', planImpact: { warnings: ['Regelmäßige Blutzuckerkontrolle empfohlen'] } },
    hypertension: { label: 'Hypertension', planImpact: { warnings: ['Blutdruck regelmäßig kontrollieren'] } },
    arthritis: { label: 'Arthritis', planImpact: { warnings: ['Gelenkschonende Übungen bevorzugen'] } },
    asthma: { label: 'Asthma', planImpact: { warnings: ['Inhalator griffbereit halten'] } },
};

// Inline health constraints logic for testing
const TAG_AVOIDANCE_RULES = {
    hiit: ['heart_disease', 'hypertension', 'cancer_active', 'copd', 'pregnancy'],
    hiit_intense: ['diabetes_type1', 'asthma', 'is_smoker'],
    heavy_lifting: ['heart_disease', 'hypertension', 'cancer_active', 'post_surgery', 'pregnancy'],
    jumping: ['arthritis', 'osteoporosis', 'knee_issues', 'hip_issues', 'ankle_issues', 'pregnancy'],
    running: ['arthritis', 'knee_issues', 'back_pain', 'copd'],
    cold_exposure: ['heart_disease', 'asthma'],
    cold_exposure_intense: ['asthma', 'copd', 'heart_disease'],
    fasting: ['diabetes_type1', 'cancer_active', 'pregnancy'],
    deep_squats: ['knee_issues', 'hip_issues', 'back_pain'],
};

const INTENSITY_CAPS = {
    gentle: ['heart_disease', 'cancer_active', 'copd', 'post_surgery', 'mobility_limited'],
    moderate: ['hypertension', 'diabetes_type1', 'cancer_remission', 'osteoporosis',
        'arthritis', 'kidney_disease', 'liver_disease', 'autoimmune', 'pregnancy']
};

function calculateIntensityCap(healthProfile) {
    if (!healthProfile) return null;

    const conditions = [
        ...(healthProfile.chronic_conditions || []),
        ...(healthProfile.injuries_limitations || [])
    ];

    for (const cond of conditions) {
        if (INTENSITY_CAPS.gentle.includes(cond)) {
            return 0;
        }
    }

    for (const cond of conditions) {
        if (INTENSITY_CAPS.moderate.includes(cond)) {
            return 1;
        }
    }

    return null;
}

function shouldExcludeTask(task, healthProfile) {
    if (!healthProfile) return false;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];
    const isSmoker = healthProfile.is_smoker || healthProfile.smoking_frequency === 'daily';
    const alcoholDaily = healthProfile.alcohol_frequency === 'daily';

    const allConditions = [
        ...conditions,
        ...injuries,
        ...(isSmoker ? ['is_smoker'] : []),
        ...(alcoholDaily ? ['alcohol_daily'] : [])
    ];

    const taskTags = task.tags || [];
    const taskId = task.id?.toLowerCase() || '';

    for (const [tagToAvoid, conditionsThatAvoid] of Object.entries(TAG_AVOIDANCE_RULES)) {
        const hasTag = taskTags.some(t => t.toLowerCase().includes(tagToAvoid)) ||
            taskId.includes(tagToAvoid);

        if (hasTag) {
            const shouldAvoid = conditionsThatAvoid.some(cond => allConditions.includes(cond));
            if (shouldAvoid) {
                return true;
            }
        }
    }

    return false;
}

function generateHealthWarnings(healthProfile) {
    const warnings = [];

    if (!healthProfile) return warnings;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];

    for (const condition of conditions) {
        const config = CHRONIC_CONDITIONS[condition];
        if (config?.planImpact?.warnings) {
            warnings.push(...config.planImpact.warnings);
        }
    }

    if (conditions.length >= 3) {
        warnings.push('Bei mehreren Erkrankungen: Regelmäßige ärztliche Kontrolle empfohlen');
    }

    if (healthProfile.takes_medications) {
        warnings.push('Medikamente können Training beeinflussen - ggf. Arzt fragen');
    }

    if (injuries.includes('pregnancy')) {
        warnings.push('Schwangerschaft: Nur nach Freigabe durch Arzt/Hebamme trainieren');
    }

    return [...new Set(warnings)];
}

// Test data
const MOCK_TASKS = [
    { id: 'hiit_1', tags: ['hiit', 'intense'], intensity: 1 },
    { id: 'heavy_lift_1', tags: ['heavy_lifting', 'strength'], intensity: 1 },
    { id: 'running_1', tags: ['running', 'cardio'], intensity: 0 },
    { id: 'gentle_walk_1', tags: ['gentle', 'light_walk'], intensity: 0 },
    { id: 'deep_squat_1', tags: ['deep_squats', 'strength'], intensity: 0 },
    { id: 'cold_shower_1', tags: ['cold_exposure'], intensity: 0 },
    { id: 'fasting_1', tags: ['fasting'], intensity: 0 },
];

const TEST_SCENARIOS = [
    {
        name: 'Scenario 1: Heart Disease (Gentle Cap)',
        healthProfile: {
            chronic_conditions: ['heart_disease'],
            injuries_limitations: [],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 0,
        expectedExclusions: ['hiit_1', 'heavy_lift_1', 'cold_shower_1'],
        expectedWarningCount: 2
    },
    {
        name: 'Scenario 2: Diabetes Type 1 (Moderate Cap)',
        healthProfile: {
            chronic_conditions: ['diabetes_type1'],
            injuries_limitations: [],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['fasting_1'],
        expectedWarningCount: 2
    },
    {
        name: 'Scenario 3: Knee Issues + Arthritis',
        healthProfile: {
            chronic_conditions: ['arthritis'],
            injuries_limitations: ['knee_issues'],
            takes_medications: false,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['running_1', 'deep_squat_1'],
        expectedWarningCount: 1
    },
    {
        name: 'Scenario 4: Pregnancy',
        healthProfile: {
            chronic_conditions: [],
            injuries_limitations: ['pregnancy'],
            takes_medications: false,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['hiit_1', 'heavy_lift_1', 'fasting_1'],
        expectedWarningCount: 1
    },
    {
        name: 'Scenario 5: Multiple Conditions (3+)',
        healthProfile: {
            chronic_conditions: ['hypertension', 'diabetes_type2', 'arthritis'],
            injuries_limitations: ['back_pain'],
            takes_medications: true,
            is_smoker: false
        },
        expectedIntensityCap: 1,
        expectedExclusions: ['hiit_1', 'heavy_lift_1', 'running_1', 'deep_squat_1'],
        expectedWarningCount: 3
    },
    {
        name: 'Scenario 6: No Health Issues (Baseline)',
        healthProfile: null,
        expectedIntensityCap: null,
        expectedExclusions: [],
        expectedWarningCount: 0
    }
];

// Test runner
function runTests() {
    console.log('🧪 Health Profile Integration Tests\n');
    console.log('='.repeat(80));

    let passed = 0;
    let failed = 0;

    TEST_SCENARIOS.forEach((scenario) => {
        console.log(`\n📋 ${scenario.name}`);
        console.log('-'.repeat(80));

        let scenarioPassed = true;

        try {
            // Test 1: Intensity Cap
            const intensityCap = calculateIntensityCap(scenario.healthProfile);
            const capMatch = intensityCap === scenario.expectedIntensityCap;
            console.log(`  ✓ Intensity Cap: ${intensityCap === null ? 'None' : intensityCap} ${capMatch ? '✅' : '❌'}`);
            if (!capMatch) {
                console.log(`    Expected: ${scenario.expectedIntensityCap}, Got: ${intensityCap}`);
                scenarioPassed = false;
            }

            // Test 2: Task Exclusions
            const excluded = MOCK_TASKS.filter(task => shouldExcludeTask(task, scenario.healthProfile));
            const excludedIds = excluded.map(t => t.id);
            const expectedExcluded = scenario.expectedExclusions;

            const allExpectedFound = expectedExcluded.every(id => excludedIds.includes(id));
            const noUnexpected = excludedIds.every(id => expectedExcluded.includes(id));
            const exclusionsMatch = allExpectedFound && noUnexpected;

            console.log(`  ✓ Excluded Tasks: ${excludedIds.length > 0 ? excludedIds.join(', ') : 'None'} ${exclusionsMatch ? '✅' : '❌'}`);
            if (!exclusionsMatch) {
                console.log(`    Expected: ${expectedExcluded.join(', ')}`);
                if (!allExpectedFound) {
                    const missing = expectedExcluded.filter(id => !excludedIds.includes(id));
                    console.log(`    Missing: ${missing.join(', ')}`);
                }
                if (!noUnexpected) {
                    const unexpected = excludedIds.filter(id => !expectedExcluded.includes(id));
                    console.log(`    Unexpected: ${unexpected.join(', ')}`);
                }
                scenarioPassed = false;
            }

            // Test 3: Health Warnings
            const warnings = generateHealthWarnings(scenario.healthProfile);
            const warningCountMatch = warnings.length >= scenario.expectedWarningCount;
            console.log(`  ✓ Warnings: ${warnings.length} ${warningCountMatch ? '✅' : '❌'}`);
            if (!warningCountMatch) {
                console.log(`    Expected: >= ${scenario.expectedWarningCount}, Got: ${warnings.length}`);
                scenarioPassed = false;
            }
            if (warnings.length > 0) {
                warnings.forEach(w => console.log(`    - ${w}`));
            }

            if (scenarioPassed) {
                console.log(`\n  ✅ PASSED`);
                passed++;
            } else {
                console.log(`\n  ❌ FAILED`);
                failed++;
            }

        } catch (error) {
            console.error(`  ❌ ERROR: ${error.message}`);
            failed++;
        }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total: ${TEST_SCENARIOS.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / TEST_SCENARIOS.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    return { passed, failed, total: TEST_SCENARIOS.length };
}

// Run tests
runTests();
