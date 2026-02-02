/**
 * Test script for Enhanced PlanBuilder v2.0
 * Run with: node --experimental-vm-modules testPlanBuilder.js
 */

import { build30DayBlueprint, TASKS_EXAMPLE } from './planBuilder.js';

// Sample intake data
const testIntake = {
    name: "Test User",
    age: 38,
    primary_goal: "energy",
    sleep_hours_bucket: "6.5-7",
    stress_1_10: 6,
    training_frequency: "1-2",
    diet_pattern: ["high_ultra_processed", "late_eating"],
    daily_time_budget: "20",
    equipment_access: "none"
};

// Test 1: Basic generation
console.log("=== TEST 1: Basic Blueprint Generation ===\n");
const result1 = build30DayBlueprint(testIntake, TASKS_EXAMPLE);
console.log("Meta version:", result1.json.meta.version);
console.log("User mastery levels:", result1.json.meta.computed.userMasteryLevels);
console.log("\nFirst 3 days preview:");
result1.json.days.slice(0, 3).forEach(day => {
    console.log(`\nDay ${day.day} (${day.dayOfWeek}, ${day.season}) - ${day.phase}`);
    console.log(`  Novelty day: ${day.isNoveltyDay}`);
    day.tasks.forEach(t => {
        console.log(`  - [${t.level}] ${t._raw_pillar}: ${t.task.substring(0, 50)}... (fresh: ${t.freshness})`);
    });
});

// Test 2: With user state (returning user)
console.log("\n\n=== TEST 2: Returning User with Completions ===\n");
const userState = {
    completedTasks: ["SLP001", "CIR001", "MEN001", "NUT001", "MOV001"],
    userCompletions: {
        sleep_recovery: 8,
        circadian_rhythm: 6,
        mental_resilience: 4,
        nutrition_metabolism: 3,
        movement_muscle: 2,
        supplements: 1
    },
    completionRate7Day: 0.85,
    energyLevel: 4
};

const result2 = build30DayBlueprint(testIntake, TASKS_EXAMPLE, userState);
console.log("User mastery levels:", result2.json.meta.computed.userMasteryLevels);
console.log("Energy level:", result2.json.meta.computed.energyLevel);
console.log("Difficulty adjustment:", result2.json.meta.computed.difficultyAdjustment);

// Test 3: Verify variety (no task repetition within 3 days - cooldown period)
console.log("\n\n=== TEST 3: Task Variety Check (3-day cooldown) ===\n");
const taskLastSeen = {};
let earlyRepetitionFound = false;
result1.json.days.forEach(day => {
    day.tasks.forEach(t => {
        const baseId = t.id.split('_').pop();
        if (taskLastSeen[baseId] && (day.day - taskLastSeen[baseId]) < 3) {
            console.log(`⚠️ Too early repetition: ${baseId} on day ${day.day} (last seen day ${taskLastSeen[baseId]})`);
            earlyRepetitionFound = true;
        }
        taskLastSeen[baseId] = day.day;
    });
});
if (!earlyRepetitionFound) {
    console.log("✅ No task repeats within 3-day cooldown period!");
}

// Count unique tasks used
const uniqueTasks = new Set(Object.keys(taskLastSeen));
console.log(`\nUnique tasks used across 30 days: ${uniqueTasks.size} / ${TASKS_EXAMPLE.length}`);
console.log(`Task variety ratio: ${(uniqueTasks.size / TASKS_EXAMPLE.length * 100).toFixed(1)}%`);

// Test 4: Check novelty days
console.log("\n\n=== TEST 4: Novelty Days ===\n");
const noveltyDays = result1.json.days.filter(d => d.isNoveltyDay);
console.log(`Found ${noveltyDays.length} novelty days:`, noveltyDays.map(d => d.day));

// Test 5: Day-of-week variation
console.log("\n\n=== TEST 5: Day-of-Week Profile Integration ===\n");
const dayTypes = new Set(result1.json.days.map(d => d.dayType));
console.log("Day types used:", [...dayTypes]);

// Test 6: Task library stats
console.log("\n\n=== TEST 6: Task Library Stats ===\n");
const stats = {
    total: TASKS_EXAMPLE.length,
    byPillar: {},
    byLevel: { beginner: 0, intermediate: 0, advanced: 0 },
    withPrerequisites: 0
};

TASKS_EXAMPLE.forEach(t => {
    stats.byPillar[t.pillar] = (stats.byPillar[t.pillar] || 0) + 1;
    stats.byLevel[t.level || 'beginner']++;
    if (t.prerequisites && t.prerequisites.length > 0) stats.withPrerequisites++;
});

console.log("Total tasks:", stats.total);
console.log("By pillar:", stats.byPillar);
console.log("By level:", stats.byLevel);
console.log("With prerequisites:", stats.withPrerequisites);

// Test 7: Experienced user with more unlocks
console.log("\n\n=== TEST 7: Experienced User (More Unlocks) ===\n");
const experiencedUserState = {
    // User has completed all beginner tasks, unlocking intermediate ones
    completedTasks: [
        "SLP001", "SLP002", "SLP003", "SLP004", "SLP005", "SLP006",
        "CIR001", "CIR002", "CIR003", "CIR004", "CIR005",
        "MEN001", "MEN002", "MEN003", "MEN004", "MEN005", "MEN006",
        "NUT001", "NUT002", "NUT003", "NUT004", "NUT005", "NUT006",
        "MOV001", "MOV002", "MOV003", "MOV004", "MOV005",
        "SUP001", "SUP002", "SUP003"
    ],
    userCompletions: {
        sleep_recovery: 20,
        circadian_rhythm: 18,
        mental_resilience: 15,
        nutrition_metabolism: 14,
        movement_muscle: 12,
        supplements: 8
    },
    completionRate7Day: 0.75,
    energyLevel: 3
};

const result3 = build30DayBlueprint(testIntake, TASKS_EXAMPLE, experiencedUserState);
console.log("User mastery levels:", result3.json.meta.computed.userMasteryLevels);

const expTaskLastSeen = {};
result3.json.days.forEach(day => {
    day.tasks.forEach(t => {
        const baseId = t.id.split('_').pop();
        expTaskLastSeen[baseId] = day.day;
    });
});
const expUniqueTasks = new Set(Object.keys(expTaskLastSeen));
console.log(`Unique tasks for experienced user: ${expUniqueTasks.size} / ${TASKS_EXAMPLE.length}`);
console.log(`Task variety ratio: ${(expUniqueTasks.size / TASKS_EXAMPLE.length * 100).toFixed(1)}%`);

// Show level distribution of selected tasks
const expLevelDist = { beginner: 0, intermediate: 0, advanced: 0 };
result3.json.days.forEach(day => {
    day.tasks.forEach(t => {
        expLevelDist[t.level]++;
    });
});
console.log("Level distribution:", expLevelDist);

console.log("\n\n=== ALL TESTS COMPLETED ===\n");
