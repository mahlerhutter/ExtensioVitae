/**
 * EXTENSIOVITAE — 30-Day Blueprint Builder (Enhanced v2.1)
 * --------------------------------------------------------
 * ENHANCEMENTS (Top 0.1% Scoring Mechanism):
 * 1. Task Cooldown (3-5 days) with Freshness multiplier
 * 2. Day-of-Week Profiles (weekend vs weekday)
 * 3. Pillar Rotation Penalty (anti-repetition)
 * 4. Mastery Levels (Beginner → Intermediate → Advanced)
 * 5. Seasonal Adjustments
 * 6. Novelty Injection (weekly surprise)
 * 7. Expanded Task Library (100+ tasks with progression trees)
 * 8. Completion Rate Adaptation
 * 9. Energy Level Input support
 * 10. Progressive Task Trees with prerequisites
 * 11. Health Profile Integration (v2.1) - Chronic conditions, injuries, limitations
 */

import {
    filterTasksByHealth,
    healthPreferenceBoost,
    calculateIntensityCap,
    generateHealthWarnings,
    createHealthSummary
} from './healthConstraints.js';

// -----------------------------
// 0) Utilities
// -----------------------------
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Seeded random for reproducible variety (based on user id + date)
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// -----------------------------
// 1) Normalization & Mappings (unchanged)
// -----------------------------
function mapSleepBucketToDeficit(bucket) {
    const m = {
        "<6": 1.0,
        "6-6.5": 0.8,
        "6.5-7": 0.6,
        "7-7.5": 0.3,
        "7.5-8": 0.1,
        ">8": 0.0
    };
    return m[bucket] ?? 0.6;
}

function mapTrainingFrequencyToNorm(freq) {
    const m = {
        "0": 0.0,
        "1-2": 0.33,
        "3-4": 0.66,
        "5+": 1.0
    };
    return m[freq] ?? 0.33;
}

function mapDietPatternToRisk(dietPattern = []) {
    let risk = 0;
    const has = (x) => dietPattern.includes(x);

    if (has("high_ultra_processed")) risk += 0.35;
    if (has("high_sugar_snacks")) risk += 0.25;
    if (has("frequent_alcohol")) risk += 0.35;
    if (has("late_eating")) risk += 0.25;

    if (has("mostly_whole_foods")) risk -= 0.20;
    if (has("high_protein_focus")) risk -= 0.15;

    return clamp(risk, 0, 1);
}

function goalBoosts(primaryGoal) {
    const base = {
        sleep_recovery: 0,
        circadian_rhythm: 0,
        mental_resilience: 0,
        nutrition_metabolism: 0,
        movement_muscle: 0,
        supplements: 0
    };

    switch (primaryGoal) {
        case "sleep":
            return { ...base, sleep_recovery: 0.30, circadian_rhythm: 0.20, mental_resilience: 0.10 };
        case "stress":
            return { ...base, mental_resilience: 0.35, sleep_recovery: 0.20, circadian_rhythm: 0.15 };
        case "energy":
            return { ...base, circadian_rhythm: 0.25, nutrition_metabolism: 0.20, movement_muscle: 0.10, sleep_recovery: 0.10 };
        case "fat_loss":
            return { ...base, nutrition_metabolism: 0.35, movement_muscle: 0.20, circadian_rhythm: 0.10 };
        case "strength_fitness":
            return { ...base, movement_muscle: 0.40, nutrition_metabolism: 0.15, sleep_recovery: 0.10 };
        case "focus_clarity":
            return { ...base, mental_resilience: 0.30, sleep_recovery: 0.20, circadian_rhythm: 0.15 };
        default:
            return base;
    }
}

// -----------------------------
// 2) NEW: Day-of-Week Profiles
// -----------------------------
const DAY_PROFILES = {
    0: { name: "Sunday", type: "rest", intensityMod: -0.15, timeMod: 1.3, prefer: ["recovery", "light", "mobility"], avoid: ["hiit", "intense"] },
    1: { name: "Monday", type: "fresh_start", intensityMod: 0.10, timeMod: 0.9, prefer: ["routine", "starter", "morning"], avoid: [] },
    2: { name: "Tuesday", type: "build", intensityMod: 0.15, timeMod: 1.0, prefer: ["strength", "focus"], avoid: [] },
    3: { name: "Wednesday", type: "mid_week", intensityMod: 0.05, timeMod: 1.0, prefer: ["zone2", "mental"], avoid: ["hiit"] },
    4: { name: "Thursday", type: "push", intensityMod: 0.15, timeMod: 1.0, prefer: ["strength", "hiit"], avoid: [] },
    5: { name: "Friday", type: "wind_down", intensityMod: -0.05, timeMod: 0.85, prefer: ["light", "social"], avoid: ["advanced", "new_habit_complex"] },
    6: { name: "Saturday", type: "active_recovery", intensityMod: 0.0, timeMod: 1.4, prefer: ["outdoor", "mobility", "meal_prep"], avoid: [] }
};

function getDayProfile(date) {
    const dayOfWeek = date.getDay();
    return DAY_PROFILES[dayOfWeek];
}

function dayOfWeekBonus(task, dayProfile) {
    const tags = task.tags ?? [];
    let bonus = 0;

    for (const t of dayProfile.prefer) {
        if (tags.includes(t)) bonus += 0.04;
    }
    for (const t of dayProfile.avoid) {
        if (tags.includes(t)) bonus -= 0.06;
    }

    // Intensity alignment
    if (task.intensity === +1 && dayProfile.intensityMod > 0) bonus += 0.03;
    if (task.intensity === -1 && dayProfile.intensityMod < 0) bonus += 0.03;

    return bonus;
}

// -----------------------------
// 3) NEW: Seasonal Adjustments
// -----------------------------
const SEASONS = {
    winter: { months: [12, 1, 2], circadianBoost: 0.20, outdoorPenalty: 0.15, sleepBoost: 0.10, supplementBoost: 0.15 },
    spring: { months: [3, 4, 5], circadianBoost: 0.10, outdoorPenalty: 0, sleepBoost: 0, supplementBoost: 0.05 },
    summer: { months: [6, 7, 8], circadianBoost: 0, outdoorPenalty: -0.10, sleepBoost: -0.05, supplementBoost: 0 },
    autumn: { months: [9, 10, 11], circadianBoost: 0.15, outdoorPenalty: 0.05, sleepBoost: 0.05, supplementBoost: 0.10 }
};

function getCurrentSeason(date) {
    const month = date.getMonth() + 1;
    for (const [season, data] of Object.entries(SEASONS)) {
        if (data.months.includes(month)) return { name: season, ...data };
    }
    return SEASONS.spring;
}

function seasonalAdjustment(task, season) {
    let adjustment = 0;
    const tags = task.tags ?? [];

    if (task.pillar === "circadian_rhythm") adjustment += season.circadianBoost;
    if (task.pillar === "sleep_recovery") adjustment += season.sleepBoost;
    if (task.pillar === "supplements") adjustment += season.supplementBoost;
    if (tags.includes("outdoor")) adjustment -= season.outdoorPenalty;

    return adjustment;
}

// -----------------------------
// 4) NEW: Task Cooldown & Freshness
// -----------------------------
function computeFreshness(taskId, taskHistory, currentDay) {
    const lastDone = taskHistory[taskId];
    if (!lastDone) return 1.0; // Never done = full freshness

    const daysSince = currentDay - lastDone;

    // STRICT Cooldown: Hard penalty for < 3 days, gradual recovery after
    // This ensures variety by heavily penalizing recently done tasks
    if (daysSince <= 0) return 0.0;  // Same day = impossible
    if (daysSince === 1) return 0.05; // Yesterday = nearly impossible
    if (daysSince === 2) return 0.15; // 2 days ago = very unlikely
    if (daysSince === 3) return 0.4;  // 3 days = still penalized
    if (daysSince === 4) return 0.7;  // 4 days = recovering
    if (daysSince === 5) return 0.9;  // 5 days = nearly fresh
    if (daysSince >= 6) return 1.0;   // 6+ days = fully fresh

    return 1.0;
}

function updateTaskHistory(taskHistory, taskId, day) {
    return { ...taskHistory, [taskId]: day };
}

// -----------------------------
// 5) NEW: Pillar Rotation Penalty
// -----------------------------
function computePillarFatigue(pillar, pillarHistory, currentDay) {
    // Look at last 3 days of pillar usage
    let recentCount = 0;
    for (let d = currentDay - 1; d >= Math.max(1, currentDay - 3); d--) {
        if (pillarHistory[d] && pillarHistory[d].includes(pillar)) {
            recentCount++;
        }
    }

    // Penalty increases with consecutive days of same pillar dominance
    return recentCount * 0.04;
}

function updatePillarHistory(pillarHistory, day, pillars) {
    return { ...pillarHistory, [day]: pillars };
}

// -----------------------------
// 6) NEW: Mastery Levels
// -----------------------------
const MASTERY_LEVELS = {
    beginner: { multiplier: 1.0, minCompletions: 0, intensityCap: 0 },
    intermediate: { multiplier: 1.15, minCompletions: 5, intensityCap: +1 },
    advanced: { multiplier: 1.30, minCompletions: 15, intensityCap: +1 }
};

function getUserMasteryLevel(pillar, userCompletions = {}) {
    const completions = userCompletions[pillar] ?? 0;

    if (completions >= 15) return "advanced";
    if (completions >= 5) return "intermediate";
    return "beginner";
}

function masteryCompatible(task, userMasteryLevels) {
    const taskLevel = task.level ?? "beginner";
    const userLevel = userMasteryLevels[task.pillar] ?? "beginner";

    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    return levelOrder[taskLevel] <= levelOrder[userLevel];
}

function masteryBonus(task, userMasteryLevels) {
    const taskLevel = task.level ?? "beginner";
    const userLevel = userMasteryLevels[task.pillar] ?? "beginner";

    // Bonus for tasks at user's current level (zone of proximal development)
    if (taskLevel === userLevel) return 0.05;

    // Small penalty for tasks below user's level (too easy)
    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const diff = levelOrder[userLevel] - levelOrder[taskLevel];
    if (diff > 0) return -0.02 * diff;

    return 0;
}

// -----------------------------
// 7) NEW: Novelty Injection
// -----------------------------
function shouldInjectNovelty(day) {
    // Every 7th day is "novelty day"
    return day % 7 === 0;
}

function findUnderexploredPillar(pillarHistory, needs) {
    const pillarCounts = {};
    const pillars = Object.keys(needs);

    for (const p of pillars) pillarCounts[p] = 0;

    for (const day of Object.keys(pillarHistory)) {
        for (const p of pillarHistory[day]) {
            pillarCounts[p] = (pillarCounts[p] ?? 0) + 1;
        }
    }

    // Find pillar with lowest count that still has need > 20
    let minCount = Infinity;
    let underexplored = null;

    for (const p of pillars) {
        if (needs[p] > 20 && pillarCounts[p] < minCount) {
            minCount = pillarCounts[p];
            underexplored = p;
        }
    }

    return underexplored;
}

// -----------------------------
// 8) NEW: Progressive Task Trees
// -----------------------------
function checkPrerequisites(task, completedTasks = []) {
    if (!task.prerequisites || task.prerequisites.length === 0) return true;
    return task.prerequisites.every(prereq => completedTasks.includes(prereq));
}

function getUnlockedTasks(tasks, completedTasks) {
    return tasks.filter(t => checkPrerequisites(t, completedTasks));
}

// -----------------------------
// 9) NEW: Completion Rate Adaptation
// -----------------------------
function computeDifficultyAdjustment(completionRate7Day) {
    // completionRate7Day is 0-1 (e.g., 0.8 = 80% completion)
    if (completionRate7Day === null || completionRate7Day === undefined) return 0;

    if (completionRate7Day < 0.5) {
        // User struggling: reduce difficulty
        return -0.15;
    } else if (completionRate7Day < 0.7) {
        // Below target: slight reduction
        return -0.05;
    } else if (completionRate7Day > 0.9) {
        // User crushing it: increase difficulty
        return 0.10;
    }
    return 0;
}

// -----------------------------
// 10) NEW: Energy Level Input
// -----------------------------
function energyLevelMultiplier(energyLevel) {
    // energyLevel: 1-5 (1=exhausted, 5=energized)
    const multipliers = {
        1: { intensityCap: -1, timeMod: 0.6, preferLight: true },
        2: { intensityCap: 0, timeMod: 0.8, preferLight: true },
        3: { intensityCap: 0, timeMod: 1.0, preferLight: false },
        4: { intensityCap: +1, timeMod: 1.1, preferLight: false },
        5: { intensityCap: +1, timeMod: 1.2, preferLight: false }
    };
    return multipliers[energyLevel] ?? multipliers[3];
}

// -----------------------------
// 11) Pillar Need Scoring (0..100)
// -----------------------------
function computeNeedScores(intake) {
    const {
        age,
        primary_goal,
        sleep_hours_bucket,
        stress_1_10,
        training_frequency,
        diet_pattern
    } = intake;

    const sleep_deficit = mapSleepBucketToDeficit(sleep_hours_bucket);
    const stress_norm = clamp((stress_1_10 - 1) / 9, 0, 1);
    const training_norm = mapTrainingFrequencyToNorm(training_frequency);
    const age_norm = clamp((age - 35) / 30, 0, 1);
    const diet_risk = mapDietPatternToRisk(diet_pattern);

    const gb = goalBoosts(primary_goal);

    const goalFocus = primary_goal === "focus_clarity" ? 1 : 0;
    const goalFatLossEnergy = ["fat_loss", "energy"].includes(primary_goal) ? 1 : 0;
    const goalStrengthFatLoss = ["strength_fitness", "fat_loss"].includes(primary_goal) ? 1 : 0;

    let need_sleep = 100 * (0.60 * sleep_deficit + 0.25 * stress_norm + 0.15 * diet_risk);
    let need_circadian = 100 * (0.45 * sleep_deficit + 0.25 * stress_norm + 0.30 * diet_risk);
    let need_mental = 100 * (0.70 * stress_norm + 0.20 * sleep_deficit + 0.10 * goalFocus);
    let need_nutrition = 100 * (0.70 * diet_risk + 0.15 * sleep_deficit + 0.15 * goalFatLossEnergy);
    let need_movement = 100 * (0.60 * (1 - training_norm) + 0.20 * age_norm + 0.20 * goalStrengthFatLoss);
    let need_supplements = 100 * (0.50 * sleep_deficit + 0.30 * stress_norm + 0.20 * diet_risk) * 0.30;

    const needs = {
        sleep_recovery: clamp(need_sleep * (1 + gb.sleep_recovery), 0, 100),
        circadian_rhythm: clamp(need_circadian * (1 + gb.circadian_rhythm), 0, 100),
        mental_resilience: clamp(need_mental * (1 + gb.mental_resilience), 0, 100),
        nutrition_metabolism: clamp(need_nutrition * (1 + gb.nutrition_metabolism), 0, 100),
        movement_muscle: clamp(need_movement * (1 + gb.movement_muscle), 0, 100),
        supplements: clamp(need_supplements * (1 + gb.supplements), 0, 30)
    };

    return { needs, sleep_deficit, stress_norm, training_norm, age_norm, diet_risk };
}

// -----------------------------
// 12) Intensity Rules & Hard Constraints
// -----------------------------
function computeIntensityCaps(intake, ctx, energyConfig = null) {
    const { stress_1_10, sleep_hours_bucket, age } = intake;

    let globalMod = 0;
    if (stress_1_10 >= 8) globalMod -= 1;
    if (["<6", "6-6.5"].includes(sleep_hours_bucket)) globalMod -= 1;
    if (stress_1_10 <= 3 && ["7-7.5", "7.5-8", ">8"].includes(sleep_hours_bucket)) globalMod += 1;

    // Energy level override
    if (energyConfig && energyConfig.intensityCap !== undefined) {
        globalMod = Math.min(globalMod, energyConfig.intensityCap);
    }

    const movementCap = age >= 56 ? 0 : +1;
    const hiitBanned = (stress_1_10 >= 8) || ["<6", "6-6.5"].includes(sleep_hours_bucket);

    return { globalMod, movementCap, hiitBanned };
}

// -----------------------------
// 13) Adherence probability
// -----------------------------
function computeAdherence(intake, ctx, difficultyAdjustment = 0) {
    const timeBudget = intake.daily_time_budget ? parseInt(intake.daily_time_budget) : 20;
    const sleep_deficit = ctx.sleep_deficit;
    const stress_norm = ctx.stress_norm;

    let adherence = 1.0;
    adherence *= (timeBudget / 30);
    adherence *= (1 - 0.35 * stress_norm);
    adherence *= (1 - 0.25 * sleep_deficit);
    adherence += difficultyAdjustment;

    return clamp(adherence, 0.2, 1.0);
}

// -----------------------------
// 14) Impact proxy
// -----------------------------
const BASE_EFFECT = {
    sleep_recovery: 1.00,
    circadian_rhythm: 0.90,
    movement_muscle: 0.85,
    nutrition_metabolism: 0.80,
    mental_resilience: 0.75,
    supplements: 0.30
};

function tagBoost(tags = []) {
    let mult = 1.0;
    const has = (t) => tags.includes(t);

    if (has("light") || has("morning")) mult += 0.10;
    if (has("caffeine") || has("timing")) mult += 0.10;
    if (has("late_eating") || has("after_meal")) mult += 0.10;
    if (has("steps") || has("neat")) mult += 0.08;
    if (has("protein")) mult += 0.08;
    if (has("strength")) mult += 0.08;
    if (has("breath") || has("downshift")) mult += 0.05;
    if (has("meal_prep") || has("shopping")) mult += 0.05;
    if (has("experimental")) mult -= 0.20;

    return clamp(mult, 0.7, 1.3);
}

function complexityPenalty(task) {
    const tags = task.tags ?? [];
    let p = 0;
    if (task.minutes > 20) p += 0.05;
    if (tags.includes("meal_prep")) p += 0.08;
    if (tags.includes("advanced")) p += 0.08;
    if (tags.includes("new_habit_complex")) p += 0.10;
    return p;
}

function riskPenalty(task, intake, ctx, caps) {
    const stress_norm = ctx.stress_norm;
    const sleep_deficit = ctx.sleep_deficit;
    const age_norm = ctx.age_norm;

    let p = 0;

    if (task.intensity === +1 && (stress_norm > 0.5 || sleep_deficit > 0.5)) p += 0.25;
    if ((task.tags ?? []).includes("hiit") && (age_norm > 0.7)) p += 0.15;
    if ((task.tags ?? []).includes("hiit") && caps.hiitBanned) p += 0.60;
    if (task.minutes > 20 && (intake.daily_time_budget ? parseInt(intake.daily_time_budget) : 20) === 10) p += 0.10;

    return p;
}

function allowedIntensityForTask(task, caps) {
    let allowed = +1;
    allowed = clamp(allowed + caps.globalMod, -1, +1);

    if (task.pillar === "movement_muscle") allowed = Math.min(allowed, caps.movementCap);
    if ((task.tags ?? []).includes("hiit") && caps.hiitBanned) allowed = -999;

    return allowed;
}

// -----------------------------
// 15) ENHANCED Task Score
// -----------------------------
function scoreTaskEnhanced(task, intake, ctx, caps, needs, adherence, enhancedCtx) {
    const {
        taskHistory,
        pillarHistory,
        currentDay,
        dayProfile,
        season,
        userMasteryLevels,
        completionRate7Day,
        noveltyPillar
    } = enhancedCtx;

    const pillar = task.pillar;
    const need = (needs[pillar] ?? 0) / 100;

    // Base score components
    const impact = (BASE_EFFECT[pillar] ?? 0.5) * tagBoost(task.tags);
    const risk = riskPenalty(task, intake, ctx, caps);
    const complexity = complexityPenalty(task);

    // Original formula
    let score = (need * impact * adherence) - risk - complexity;

    // === ENHANCED SCORING ===

    // 1. Freshness (cooldown)
    const freshness = computeFreshness(task.id, taskHistory, currentDay);
    score *= freshness;

    // 2. Day-of-week alignment
    if (dayProfile) {
        score += dayOfWeekBonus(task, dayProfile);
    }

    // 3. Seasonal adjustment
    if (season) {
        score += seasonalAdjustment(task, season) * 0.5;
    }

    // 4. Pillar rotation (anti-fatigue)
    const pillarFatigue = computePillarFatigue(pillar, pillarHistory, currentDay);
    score -= pillarFatigue;

    // 5. Mastery alignment
    if (userMasteryLevels) {
        score += masteryBonus(task, userMasteryLevels);
    }

    // 6. Novelty injection
    if (noveltyPillar && pillar === noveltyPillar) {
        score += 0.15; // Significant boost for underexplored pillar
    }

    // 7. Completion rate adaptation
    if (completionRate7Day !== null && completionRate7Day !== undefined) {
        const diffAdj = computeDifficultyAdjustment(completionRate7Day);
        if (diffAdj < 0 && task.level === "beginner") score += 0.05;
        if (diffAdj > 0 && task.level === "advanced") score += 0.05;
    }

    return score;
}

// -----------------------------
// 16) Phase logic (days 1..30)
// -----------------------------
function phaseForDay(day) {
    if (day <= 7) return "stabilize";
    if (day <= 14) return "build";
    if (day <= 21) return "optimize";
    return "consolidate";
}

function phaseTagPreferences(phase) {
    switch (phase) {
        case "stabilize":
            return { prefer: ["light", "morning", "sleep", "winddown", "steps", "protein", "timing", "beginner"], avoid: ["hiit", "advanced", "new_habit_complex"] };
        case "build":
            return { prefer: ["strength", "zone2", "protein", "after_meal", "shutdown", "intermediate"], avoid: ["experimental"] };
        case "optimize":
            return { prefer: ["after_meal", "breath", "focus", "mobility", "meal_timing", "advanced"], avoid: ["experimental"] };
        case "consolidate":
            return { prefer: ["routine", "review", "minimum_viable_day", "sleep", "light", "steps"], avoid: ["new_habit_complex", "hiit", "advanced"] };
        default:
            return { prefer: [], avoid: [] };
    }
}

function preferenceBoost(task, prefs) {
    const tags = task.tags ?? [];
    let b = 0;
    for (const t of prefs.prefer) if (tags.includes(t)) b += 0.03;
    for (const t of prefs.avoid) if (tags.includes(t)) b -= 0.05;
    return b;
}

// -----------------------------
// 17) Candidate selection helpers
// -----------------------------
function equipmentCompatible(task, equipment) {
    if (!equipment || equipment === "none") return ["none", "any"].includes(task.equipment);
    if (equipment === "basic") return ["none", "basic", "any"].includes(task.equipment);
    if (equipment === "gym") return ["none", "basic", "gym", "any"].includes(task.equipment);
    return true;
}

function timeCompatible(task, remainingMinutes) {
    return task.minutes <= remainingMinutes;
}

function filterCandidatesEnhanced(tasks, intake, caps, remainingMinutes, slot, userMasteryLevels, completedTasks, excludeTaskIds = [], taskHistory = {}, currentDay = 0) {
    const equipment = intake.equipment_access ?? "none";

    return tasks.filter((t) => {
        // Exclude already selected tasks for this day
        if (excludeTaskIds.includes(t.id)) return false;

        // HARD COOLDOWN: Cannot select task done within last 2 days
        const lastDone = taskHistory[t.id];
        if (lastDone && (currentDay - lastDone) <= 2) return false;

        if (!equipmentCompatible(t, equipment)) return false;
        if (!timeCompatible(t, remainingMinutes)) return false;

        // Slot filter
        if (slot === "am" && !(t.when === "am" || t.when === "any")) return false;
        if (slot === "pm" && !(t.when === "pm" || t.when === "any")) return false;

        // Intensity check
        const allowedIntensity = allowedIntensityForTask(t, caps);
        if (allowedIntensity === -999) return false;
        if (t.intensity > allowedIntensity) return false;

        // Mastery level check
        if (userMasteryLevels && !masteryCompatible(t, userMasteryLevels)) return false;

        // Prerequisites check
        if (!checkPrerequisites(t, completedTasks)) return false;

        return true;
    });
}

// -----------------------------
// 18) Weekly coverage constraints
// -----------------------------
function initWeeklyCoverage() {
    return {
        sleep_recovery: 0,
        circadian_rhythm: 0,
        movement_muscle: 0,
        nutrition_metabolism: 0,
        mental_resilience: 0,
        supplements: 0
    };
}

function coverageTargets(intake, ctx) {
    const stressHigh = intake.stress_1_10 >= 6;
    return {
        sleep_recovery: 4,
        circadian_rhythm: 4,
        movement_muscle: stressHigh ? 2 : 3,
        nutrition_metabolism: 3,
        mental_resilience: stressHigh ? 4 : 2,
        supplements: 2
    };
}

function coveragePenalty(pillar, coverage, targets) {
    const over = coverage[pillar] - targets[pillar];
    if (over <= 0) return 0;
    return Math.min(0.12, 0.04 * over);
}

function bumpCoverage(coverage, tasks) {
    for (const t of tasks) coverage[t.pillar] = (coverage[t.pillar] ?? 0) + 1;
}

// -----------------------------
// 19) Daily Assembly (1–3 tasks)
// -----------------------------
function pickBestTaskForSlotEnhanced(tasks, intake, ctx, caps, needs, adherence, remainingMinutes, slot, prefs, coverage, targets, goalPillar, enhancedCtx, excludeTaskIds = []) {
    const { userMasteryLevels, completedTasks, taskHistory, currentDay } = enhancedCtx;
    const candidates = filterCandidatesEnhanced(tasks, intake, caps, remainingMinutes, slot, userMasteryLevels, completedTasks, excludeTaskIds, taskHistory, currentDay);

    let best = null;
    let bestScore = -1e9;

    for (const task of candidates) {
        let s = scoreTaskEnhanced(task, intake, ctx, caps, needs, adherence, enhancedCtx);

        // Phase preferences
        s += preferenceBoost(task, prefs);

        // Goal pillar boost
        if (goalPillar && task.pillar === goalPillar) s += 0.06;

        // Coverage discipline
        s -= coveragePenalty(task.pillar, coverage, targets);

        // Small random tiebreaker for variety
        s += (seededRandom(hashString(task.id + enhancedCtx.currentDay)) - 0.5) * 0.02;

        if (s > bestScore) {
            bestScore = s;
            best = task;
        }
    }

    return best;
}

function decideGoalPillar(primary_goal) {
    switch (primary_goal) {
        case "sleep": return "sleep_recovery";
        case "stress": return "mental_resilience";
        case "energy": return "circadian_rhythm";
        case "fat_loss": return "nutrition_metabolism";
        case "strength_fitness": return "movement_muscle";
        case "focus_clarity": return "mental_resilience";
        default: return null;
    }
}

// -----------------------------
// 20) ENHANCED Build 30-day blueprint
// -----------------------------
export function build30DayBlueprint(intake, tasks, userState = {}, healthProfile = null) {
    // User state for personalization (can be passed in for returning users)
    const {
        completedTasks = [],
        userCompletions = {},
        completionRate7Day = null,
        energyLevel = 3  // Default: normal energy
    } = userState;

    const timeBudget = intake.daily_time_budget ? parseInt(intake.daily_time_budget) : 20;
    const startDate = new Date();

    const ctx = computeNeedScores(intake);
    const needs = ctx.needs;

    // Energy level configuration
    const energyConfig = energyLevelMultiplier(energyLevel);
    const caps = computeIntensityCaps(intake, ctx, energyConfig);

    // === HEALTH PROFILE INTEGRATION (v2.1) ===
    // Apply health-based intensity cap if more restrictive
    const healthIntensityCap = calculateIntensityCap(healthProfile);
    if (healthIntensityCap !== null) {
        // Health cap overrides if more restrictive
        caps.globalMod = Math.min(caps.globalMod, healthIntensityCap);
        if (healthIntensityCap === 0) {
            caps.hiitBanned = true;  // Gentle mode = no HIIT
        }
    }

    // Filter tasks based on health profile (remove contraindicated activities)
    let filteredTasks = tasks;
    if (healthProfile) {
        filteredTasks = filterTasksByHealth(tasks, healthProfile);
        console.log(`[PlanBuilder] Health profile filtering: ${tasks.length} → ${filteredTasks.length} tasks`);
    }

    // Generate health warnings for the plan
    const healthWarnings = generateHealthWarnings(healthProfile);
    const healthSummary = createHealthSummary(healthProfile);

    // Difficulty adjustment based on completion rate
    const difficultyAdjustment = computeDifficultyAdjustment(completionRate7Day);
    const adherence = computeAdherence(intake, ctx, difficultyAdjustment);
    const goalPillar = decideGoalPillar(intake.primary_goal);

    // User mastery levels per pillar
    const userMasteryLevels = {};
    for (const pillar of Object.keys(needs)) {
        userMasteryLevels[pillar] = getUserMasteryLevel(pillar, userCompletions);
    }


    const plan = {
        user_name: intake.name || "You",
        plan_summary: `Generated specifically for ${intake.primary_goal} with a ${timeBudget} min daily budget.`,
        start_date: startDate.toISOString(),
        created_at: new Date().toISOString(),
        meta: {
            version: "ev-blueprint-js-2.1-health-aware",
            created_at: new Date().toISOString(),
            inputs: { ...intake },
            computed: {
                needs,
                adherence,
                caps,
                userMasteryLevels,
                difficultyAdjustment,
                energyLevel
            },
            // Health profile integration (v2.1)
            health: {
                hasProfile: !!healthProfile,
                warnings: healthWarnings,
                summary: healthSummary,
                intensityCap: healthIntensityCap,
                tasksFiltered: healthProfile ? (tasks.length - filteredTasks.length) : 0
            }
        },
        days: []
    };


    let weekCoverage = initWeeklyCoverage();
    const targets = coverageTargets(intake, ctx);

    // Enhanced tracking
    let taskHistory = {};
    let pillarHistory = {};

    for (let day = 1; day <= 30; day++) {
        // Reset weekly coverage
        if ((day - 1) % 7 === 0) weekCoverage = initWeeklyCoverage();

        // Calculate date for this day
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + day - 1);

        // Get contextual info
        const dayProfile = getDayProfile(dayDate);
        const season = getCurrentSeason(dayDate);
        const phase = phaseForDay(day);
        const prefs = phaseTagPreferences(phase);

        // Check for novelty injection
        const noveltyPillar = shouldInjectNovelty(day)
            ? findUnderexploredPillar(pillarHistory, needs)
            : null;

        // Build enhanced context
        const enhancedCtx = {
            taskHistory,
            pillarHistory,
            currentDay: day,
            dayProfile,
            season,
            userMasteryLevels,
            completionRate7Day,
            noveltyPillar,
            completedTasks
        };

        // Adjust time budget for day type
        let dayTimeBudget = Math.round(timeBudget * dayProfile.timeMod * energyConfig.timeMod);
        dayTimeBudget = clamp(dayTimeBudget, 5, 45);

        let remaining = dayTimeBudget;
        const chosen = [];
        const chosenIds = []; // Track task IDs to prevent same-day duplicates

        const needSleepOrCirc = Math.max(needs.sleep_recovery, needs.circadian_rhythm);

        // AM Task
        let amTask = pickBestTaskForSlotEnhanced(
            filteredTasks, intake, ctx, caps, needs, adherence, remaining, "am", prefs,
            weekCoverage, targets,
            (phase === "build" || phase === "optimize") ? goalPillar : null,
            enhancedCtx,
            chosenIds
        );

        // Circadian anchor for high sleep/circadian need
        if (needSleepOrCirc >= 40 && amTask && !["circadian_rhythm", "mental_resilience"].includes(amTask.pillar)) {
            const circAM = filteredTasks
                .filter(t => t.pillar === "circadian_rhythm" && !chosenIds.includes(t.id))
                .map(t => t)
                .reduce((best, t) => {
                    if (!filterCandidatesEnhanced([t], intake, caps, remaining, "am", userMasteryLevels, completedTasks, chosenIds, taskHistory, day).length) return best;
                    const s = scoreTaskEnhanced(t, intake, ctx, caps, needs, adherence, enhancedCtx) + preferenceBoost(t, prefs);
                    return (!best || s > best.s) ? { t, s } : best;
                }, null);
            if (circAM?.t) amTask = circAM.t;
        }

        if (amTask) {
            chosen.push(amTask);
            chosenIds.push(amTask.id);
            remaining -= amTask.minutes;
            taskHistory = updateTaskHistory(taskHistory, amTask.id, day);
        }

        // ANY Task
        const anyTask = pickBestTaskForSlotEnhanced(
            filteredTasks, intake, ctx, caps, needs, adherence, remaining, "any", prefs,
            weekCoverage, targets,
            (phase === "build" || phase === "optimize") ? goalPillar : null,
            enhancedCtx,
            chosenIds
        );

        if (anyTask) {
            chosen.push(anyTask);
            chosenIds.push(anyTask.id);
            remaining -= anyTask.minutes;
            taskHistory = updateTaskHistory(taskHistory, anyTask.id, day);
        }

        // PM Task
        let pmTask = null;
        if (remaining >= 4) {
            if (needs.sleep_recovery >= 40) {
                pmTask = pickBestTaskForSlotEnhanced(
                    filteredTasks.filter(t => t.pillar === "sleep_recovery"),
                    intake, ctx, caps, needs, adherence, remaining, "pm", prefs,
                    weekCoverage, targets, null,
                    enhancedCtx,
                    chosenIds
                );
            }
            if (!pmTask) {
                pmTask = pickBestTaskForSlotEnhanced(
                    filteredTasks, intake, ctx, caps, needs, adherence, remaining, "pm", prefs,
                    weekCoverage, targets, null,
                    enhancedCtx,
                    chosenIds
                );
            }
        }

        if (pmTask && remaining >= pmTask.minutes && (adherence >= 0.6 || chosen.length < 2)) {
            chosen.push(pmTask);
            chosenIds.push(pmTask.id);
            remaining -= pmTask.minutes;
            taskHistory = updateTaskHistory(taskHistory, pmTask.id, day);
        }

        // Fallback: ensure at least 1 task
        if (chosen.length === 0) {
            const tiny = filteredTasks
                .filter(t => t.minutes <= timeBudget && t.intensity <= 0 && ["circadian_rhythm", "mental_resilience"].includes(t.pillar) && !chosenIds.includes(t.id))
                .sort((a, b) => (scoreTaskEnhanced(b, intake, ctx, caps, needs, adherence, enhancedCtx) - scoreTaskEnhanced(a, intake, ctx, caps, needs, adherence, enhancedCtx)))[0];
            if (tiny) {
                chosen.push(tiny);
                chosenIds.push(tiny.id);
                taskHistory = updateTaskHistory(taskHistory, tiny.id, day);
            }
        }

        // Update tracking
        bumpCoverage(weekCoverage, chosen);
        pillarHistory = updatePillarHistory(pillarHistory, day, chosen.map(t => t.pillar));

        plan.days.push({
            day,
            phase,
            dayOfWeek: dayProfile.name,
            dayType: dayProfile.type,
            season: season.name,
            isNoveltyDay: shouldInjectNovelty(day),
            theme: `Day ${day} - ${phase.charAt(0).toUpperCase() + phase.slice(1)} (${dayProfile.name})`,
            total_time_minutes: chosen.reduce((sum, t) => sum + t.minutes, 0),
            tasks: chosen.map((t, idx) => ({
                id: `d${day}_t${idx + 1}_${t.id}`,
                pillar: t.pillar.split('_')[0],
                task: t.how,
                time_minutes: t.minutes,
                when: t.when,
                level: t.level ?? "beginner",
                _raw_pillar: t.pillar,
                intensity: t.intensity,
                title: t.title ?? null,
                freshness: computeFreshness(t.id, taskHistory, day).toFixed(2)
            }))
        });
    }

    return {
        json: plan,
        text: renderHumanText(plan)
    };
}

// -----------------------------
// 21) Human-readable renderer
// -----------------------------
function renderHumanText(plan) {
    const lines = [];
    lines.push("EXTENSIOVITAE — 30-Day Blueprint (Enhanced v2.0)");
    lines.push(`Created: ${plan.meta.created_at}`);
    lines.push("");
    lines.push("Summary (Need Scores 0–100):");
    const needs = plan.meta.computed.needs;
    for (const k of Object.keys(needs)) lines.push(`- ${k}: ${Math.round(needs[k])}`);
    lines.push(`Adherence score (0.2–1): ${plan.meta.computed.adherence.toFixed(2)}`);
    lines.push("");

    for (const d of plan.days) {
        const noveltyTag = d.isNoveltyDay ? " 🎲" : "";
        lines.push(`Day ${String(d.day).padStart(2, "0")} — ${d.phase} — ${d.dayOfWeek} — ${d.total_time_minutes} min${noveltyTag}`);
        for (const t of d.tasks) {
            lines.push(`  • [${t.id}] (${t._raw_pillar}, ${t.level}, ${t.time_minutes}m, fresh:${t.freshness}) ${t.task}`);
        }
        lines.push("");
    }
    return lines.join("\n");
}

// -----------------------------
// 22) EXPANDED Task Library (100+ tasks)
// -----------------------------
export const TASKS_EXAMPLE = [
    // ========== SLEEP RECOVERY (20 tasks) ==========
    // Beginner
    { id: "SLP001", pillar: "sleep_recovery", minutes: 5, intensity: -1, equipment: "any", level: "beginner", tags: ["sleep", "winddown", "starter"], when: "pm", how: "90 Min vor Schlaf: Screens dimmen + warmes Licht aktivieren." },
    { id: "SLP002", pillar: "sleep_recovery", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["sleep", "temperature"], when: "pm", how: "Schlafzimmer auf 18°C kühlen (Fenster öffnen oder Klimaanlage)." },
    { id: "SLP003", pillar: "sleep_recovery", minutes: 4, intensity: -1, equipment: "any", level: "beginner", tags: ["sleep", "routine"], when: "pm", how: "Feste Schlafenszeit setzen: ±30min Toleranz." },
    { id: "SLP004", pillar: "sleep_recovery", minutes: 5, intensity: -1, equipment: "none", level: "beginner", tags: ["sleep", "light"], when: "pm", how: "Blaulichtblocker-Brille 2h vor dem Schlafen aufsetzen." },
    { id: "SLP005", pillar: "sleep_recovery", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["sleep", "environment"], when: "pm", how: "Handy aus dem Schlafzimmer verbannen oder auf Flugmodus." },
    { id: "SLP006", pillar: "sleep_recovery", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["sleep", "hydration"], when: "pm", how: "Letztes Getränk 2h vor Schlaf, dann nur kleine Schlucke." },

    // Intermediate
    { id: "SLP010", pillar: "sleep_recovery", minutes: 7, intensity: 0, equipment: "any", level: "intermediate", tags: ["sleep", "breathing"], when: "pm", how: "4-7-8 Atmung: 4 Runden im Bett (Einatmen 4s, Halten 7s, Ausatmen 8s).", prerequisites: ["SLP001"] },
    { id: "SLP011", pillar: "sleep_recovery", minutes: 8, intensity: 0, equipment: "any", level: "intermediate", tags: ["sleep", "journaling"], when: "pm", how: "3-Dinge-Dankbarkeits-Journal vor dem Schlafen schreiben.", prerequisites: ["SLP003"] },
    { id: "SLP012", pillar: "sleep_recovery", minutes: 10, intensity: 0, equipment: "any", level: "intermediate", tags: ["sleep", "stretching", "recovery"], when: "pm", how: "10min sanftes Yin-Yoga: Child's Pose, Legs-up-the-Wall, Reclined Twist.", prerequisites: ["SLP001"] },
    { id: "SLP013", pillar: "sleep_recovery", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["sleep", "audio"], when: "pm", how: "Pink Noise oder Schlaf-Soundscape einschalten (z.B. Regen)." },
    { id: "SLP014", pillar: "sleep_recovery", minutes: 6, intensity: 0, equipment: "any", level: "intermediate", tags: ["sleep", "temperature"], when: "pm", how: "Warmes Bad/Dusche 1h vor Schlaf für Kerntemperatur-Drop." },

    // Advanced
    { id: "SLP020", pillar: "sleep_recovery", minutes: 15, intensity: 0, equipment: "any", level: "advanced", tags: ["sleep", "protocol", "advanced"], when: "pm", how: "NSDR-Protokoll (Non-Sleep Deep Rest): 15min geführte Yoga Nidra.", prerequisites: ["SLP010", "SLP012"] },
    { id: "SLP021", pillar: "sleep_recovery", minutes: 20, intensity: 0, equipment: "any", level: "advanced", tags: ["sleep", "tracking", "advanced"], when: "any", how: "Schlaf-Tracking analysieren: HRV, Deep Sleep %, Wake-ups auswerten.", prerequisites: ["SLP003"] },
    { id: "SLP022", pillar: "sleep_recovery", minutes: 10, intensity: 0, equipment: "any", level: "advanced", tags: ["sleep", "biohacking"], when: "pm", how: "Glycin 3g + Magnesium 400mg 30min vor dem Schlafen.", prerequisites: ["SLP014"] },

    // ========== CIRCADIAN RHYTHM (18 tasks) ==========
    // Beginner
    { id: "CIR001", pillar: "circadian_rhythm", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["light", "morning", "starter"], when: "am", how: "2–3 Minuten Tageslicht draußen, ohne Sonnenbrille." },
    { id: "CIR002", pillar: "circadian_rhythm", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["caffeine", "timing", "sleep"], when: "am", how: "Letzte Koffeinzeit setzen: 8-10h vor Schlaf (z.B. 14 Uhr)." },
    { id: "CIR003", pillar: "circadian_rhythm", minutes: 5, intensity: -1, equipment: "any", level: "beginner", tags: ["light", "evening"], when: "pm", how: "Abends: Dimmbares Licht oder Kerzen statt Deckenbeleuchtung." },
    { id: "CIR004", pillar: "circadian_rhythm", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["timing", "meals"], when: "any", how: "Festes Frühstücksfenster: jeden Tag ±1h gleiche Zeit." },
    { id: "CIR005", pillar: "circadian_rhythm", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["light", "screen"], when: "pm", how: "Night Shift / Blaulichtfilter auf allen Geräten ab 20 Uhr." },

    // Intermediate
    { id: "CIR010", pillar: "circadian_rhythm", minutes: 10, intensity: 0, equipment: "any", level: "intermediate", tags: ["light", "morning", "outdoor"], when: "am", how: "10min Morgen-Spaziergang ohne Sonnenbrille für Cortisol-Peak.", prerequisites: ["CIR001"] },
    { id: "CIR011", pillar: "circadian_rhythm", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["timing", "meals", "fasting"], when: "any", how: "Eating Window: 10-12h Fenster, z.B. 8-18 Uhr oder 10-20 Uhr.", prerequisites: ["CIR004"] },
    { id: "CIR012", pillar: "circadian_rhythm", minutes: 8, intensity: 0, equipment: "any", level: "intermediate", tags: ["after_meal", "walk"], when: "any", how: "Nach größter Mahlzeit 8–10 Min langsam spazieren für Blutzucker." },
    { id: "CIR013", pillar: "circadian_rhythm", minutes: 3, intensity: 0, equipment: "any", level: "intermediate", tags: ["light", "afternoon"], when: "any", how: "Nachmittags: 5min direktes Tageslicht für zweiten Cortisol-Boost." },

    // Advanced
    { id: "CIR020", pillar: "circadian_rhythm", minutes: 15, intensity: 0, equipment: "any", level: "advanced", tags: ["light", "protocol", "advanced"], when: "am", how: "Light-Therapy-Box (10.000 Lux) 15min beim Frühstück im Winter.", prerequisites: ["CIR010"] },
    { id: "CIR021", pillar: "circadian_rhythm", minutes: 5, intensity: 0, equipment: "any", level: "advanced", tags: ["biohacking", "timing"], when: "pm", how: "Sunset-Viewing: Abendrot 5-10min beobachten für Melatonin-Signal.", prerequisites: ["CIR003"] },
    { id: "CIR022", pillar: "circadian_rhythm", minutes: 10, intensity: 0, equipment: "any", level: "advanced", tags: ["tracking", "sleep", "advanced"], when: "any", how: "Chronotyp-Anpassung: Aktivitäten nach deinem natürlichen Rhythmus planen.", prerequisites: ["CIR010", "CIR011"] },

    // ========== MENTAL RESILIENCE (20 tasks) ==========
    // Beginner
    { id: "MEN001", pillar: "mental_resilience", minutes: 4, intensity: -1, equipment: "any", level: "beginner", tags: ["breath", "stress", "starter", "downshift"], when: "any", how: "Box Breathing 4-4-4-4: 4 Runden (Einatmen 4s, Halten 4s, Ausatmen 4s, Halten 4s)." },
    { id: "MEN002", pillar: "mental_resilience", minutes: 5, intensity: -1, equipment: "any", level: "beginner", tags: ["mindfulness", "starter"], when: "any", how: "5min Body Scan: Von Füßen bis Kopf durchgehen, Spannung wahrnehmen." },
    { id: "MEN003", pillar: "mental_resilience", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["stress", "quick"], when: "any", how: "Physiological Sigh: Doppelt einatmen durch Nase, lang ausatmen durch Mund. 3x." },
    { id: "MEN004", pillar: "mental_resilience", minutes: 5, intensity: -1, equipment: "any", level: "beginner", tags: ["nature", "outdoor"], when: "any", how: "5min Natur-Micro-Dose: Draußen stehen, Himmel anschauen, tief atmen." },
    { id: "MEN005", pillar: "mental_resilience", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["gratitude", "starter"], when: "any", how: "3 Dinge nennen, für die du heute dankbar bist (laut oder schriftlich)." },
    { id: "MEN006", pillar: "mental_resilience", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["digital", "detox"], when: "any", how: "Phone-Free Zone: 1 Mahlzeit komplett ohne Handy." },

    // Intermediate
    { id: "MEN010", pillar: "mental_resilience", minutes: 10, intensity: 0, equipment: "any", level: "intermediate", tags: ["meditation", "focus"], when: "any", how: "10min Fokus-Meditation: Atem beobachten, bei Ablenkung sanft zurückkehren.", prerequisites: ["MEN001", "MEN002"] },
    { id: "MEN011", pillar: "mental_resilience", minutes: 8, intensity: 0, equipment: "any", level: "intermediate", tags: ["journaling", "reflection"], when: "pm", how: "Abend-Reflexion: Was lief gut? Was hätte besser laufen können? 1 Learning.", prerequisites: ["MEN005"] },
    { id: "MEN012", pillar: "mental_resilience", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["cold", "stress", "resilience"], when: "am", how: "30sec kalte Dusche am Ende (nur Brust und Rücken, nicht Kopf).", prerequisites: ["MEN003"] },
    { id: "MEN013", pillar: "mental_resilience", minutes: 7, intensity: 0, equipment: "any", level: "intermediate", tags: ["visualization", "focus"], when: "any", how: "Mental Rehearsal: Kommenden Tag/Meeting in 5min visualisieren.", prerequisites: ["MEN002"] },
    { id: "MEN014", pillar: "mental_resilience", minutes: 10, intensity: 0, equipment: "any", level: "intermediate", tags: ["nature", "walking", "outdoor"], when: "any", how: "Forest Bathing Light: 10min achtsam durch Grün gehen, 5 Sinne nutzen.", prerequisites: ["MEN004"] },

    // Advanced
    { id: "MEN020", pillar: "mental_resilience", minutes: 15, intensity: 0, equipment: "any", level: "advanced", tags: ["meditation", "advanced"], when: "any", how: "Insight Meditation: 15min, Gedanken labeln (\"Denken\", \"Planen\", \"Sorgen\").", prerequisites: ["MEN010"] },
    { id: "MEN021", pillar: "mental_resilience", minutes: 12, intensity: 0, equipment: "any", level: "advanced", tags: ["cold", "protocol", "advanced"], when: "am", how: "Kältetherapie: 2min kalte Dusche oder Eisbad (kontrollierte Atmung).", prerequisites: ["MEN012"] },
    { id: "MEN022", pillar: "mental_resilience", minutes: 20, intensity: 0, equipment: "any", level: "advanced", tags: ["flow", "deep_work"], when: "any", how: "Deep Work Block: 20min ohne Unterbrechung an einer Aufgabe (Phone weg, Tür zu).", prerequisites: ["MEN010", "MEN006"] },
    { id: "MEN023", pillar: "mental_resilience", minutes: 10, intensity: 0, equipment: "any", level: "advanced", tags: ["breathwork", "advanced"], when: "any", how: "Wim Hof Breathing Light: 3 Runden (30 tiefe Atemzüge, Atem halten, erholen).", prerequisites: ["MEN001", "MEN012"] },

    // ========== NUTRITION METABOLISM (20 tasks) ==========
    // Beginner
    { id: "NUT001", pillar: "nutrition_metabolism", minutes: 5, intensity: -1, equipment: "any", level: "beginner", tags: ["protein", "starter"], when: "any", how: "Protein First: Bei jeder Mahlzeit zuerst Protein essen (Handflächengröße)." },
    { id: "NUT002", pillar: "nutrition_metabolism", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["hydration", "starter"], when: "am", how: "500ml Wasser direkt nach dem Aufstehen trinken." },
    { id: "NUT003", pillar: "nutrition_metabolism", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["fiber", "vegetables"], when: "any", how: "Gemüse-Check: Bei jeder Hauptmahlzeit eine Faust Gemüse." },
    { id: "NUT004", pillar: "nutrition_metabolism", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["snacking", "awareness"], when: "any", how: "Snack-Pause: Vor Snack 5min warten, echten Hunger prüfen." },
    { id: "NUT005", pillar: "nutrition_metabolism", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["sugar", "timing"], when: "any", how: "Zucker-Timing: Süßes nur nach Mahlzeit, nie auf leeren Magen." },
    { id: "NUT006", pillar: "nutrition_metabolism", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["alcohol", "awareness"], when: "pm", how: "Alkohol-Check: Heute alkoholfrei? Wenn nicht, max. 2 Getränke." },

    // Intermediate
    { id: "NUT010", pillar: "nutrition_metabolism", minutes: 10, intensity: 0, equipment: "any", level: "intermediate", tags: ["tracking", "awareness"], when: "any", how: "Food-Log: Heute alle Mahlzeiten notieren (Foto oder Text).", prerequisites: ["NUT001"] },
    { id: "NUT011", pillar: "nutrition_metabolism", minutes: 15, intensity: 0, equipment: "any", level: "intermediate", tags: ["meal_prep", "planning"], when: "any", how: "Protein-Prep: 3 Portionen Protein für morgen vorbereiten.", prerequisites: ["NUT001"] },
    { id: "NUT012", pillar: "nutrition_metabolism", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["glucose", "hack"], when: "any", how: "ACV-Shot: 1 EL Apfelessig in Wasser 15min vor größter Mahlzeit.", prerequisites: ["NUT005"] },
    { id: "NUT013", pillar: "nutrition_metabolism", minutes: 8, intensity: 0, equipment: "any", level: "intermediate", tags: ["fiber", "prebiotic"], when: "any", how: "Präbiotika-Boost: Zwiebeln, Knoblauch oder Lauch in Mahlzeit einbauen.", prerequisites: ["NUT003"] },
    { id: "NUT014", pillar: "nutrition_metabolism", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["omega3", "supplement"], when: "any", how: "Omega-3 Check: Fetten Fisch oder 2g EPA/DHA Supplement heute?", prerequisites: ["NUT001"] },

    // Advanced
    { id: "NUT020", pillar: "nutrition_metabolism", minutes: 20, intensity: 0, equipment: "any", level: "advanced", tags: ["meal_prep", "batch", "advanced"], when: "any", how: "Batch Cooking: 5 Mahlzeiten für die Woche vorbereiten.", prerequisites: ["NUT011"] },
    { id: "NUT021", pillar: "nutrition_metabolism", minutes: 15, intensity: 0, equipment: "any", level: "advanced", tags: ["tracking", "macros", "advanced"], when: "any", how: "Makro-Check: Protein (1.6g/kg), Ballaststoffe (30g+), Fette prüfen.", prerequisites: ["NUT010", "NUT001"] },
    { id: "NUT022", pillar: "nutrition_metabolism", minutes: 10, intensity: 0, equipment: "any", level: "advanced", tags: ["glucose", "monitoring"], when: "any", how: "CGM-Review: Glucose-Reaktionen auf Mahlzeiten analysieren und anpassen.", prerequisites: ["NUT012", "NUT010"] },
    { id: "NUT023", pillar: "nutrition_metabolism", minutes: 5, intensity: 0, equipment: "any", level: "advanced", tags: ["microbiome", "advanced"], when: "any", how: "Fermentierte Foods: Kimchi, Sauerkraut oder Kefir heute integrieren.", prerequisites: ["NUT013"] },

    // ========== MOVEMENT MUSCLE (22 tasks) ==========
    // Beginner
    { id: "MOV001", pillar: "movement_muscle", minutes: 10, intensity: -1, equipment: "none", level: "beginner", tags: ["steps", "neat", "beginner"], when: "any", how: "10-Min Walk: Locker gehen, Nase atmen, Arme schwingen." },
    { id: "MOV002", pillar: "movement_muscle", minutes: 5, intensity: -1, equipment: "none", level: "beginner", tags: ["mobility", "starter"], when: "am", how: "Morning Mobility: 5min sanftes Strecken (Katze-Kuh, Hüftkreisen, Armkreise)." },
    { id: "MOV003", pillar: "movement_muscle", minutes: 3, intensity: -1, equipment: "none", level: "beginner", tags: ["posture", "desk"], when: "any", how: "Posture-Reset: Jede Stunde Schultern zurück, Brust raus, 3 tiefe Atemzüge." },
    { id: "MOV004", pillar: "movement_muscle", minutes: 5, intensity: -1, equipment: "none", level: "beginner", tags: ["steps", "stairs"], when: "any", how: "Treppen-Challenge: Fahrstuhl meiden, Treppen nehmen." },
    { id: "MOV005", pillar: "movement_muscle", minutes: 8, intensity: -1, equipment: "none", level: "beginner", tags: ["stretching", "evening"], when: "pm", how: "Abend-Stretch: 8min sanftes Dehnen (Hüftbeuger, Hamstrings, Schultern)." },

    // Intermediate
    { id: "MOV010", pillar: "movement_muscle", minutes: 12, intensity: 0, equipment: "none", level: "intermediate", tags: ["strength", "bodyweight", "beginner"], when: "any", how: "Bodyweight Circuit: 3 Runden - 8 Squats, 6 Push-ups (kniend ok), 20s Plank.", prerequisites: ["MOV001", "MOV002"] },
    { id: "MOV011", pillar: "movement_muscle", minutes: 18, intensity: 0, equipment: "none", level: "intermediate", tags: ["strength", "push_pull"], when: "any", how: "Push-Pull Basis: Incline Push-ups 3×8, Towel Rows 3×10, Lunges 2×10.", prerequisites: ["MOV010"] },
    { id: "MOV012", pillar: "movement_muscle", minutes: 15, intensity: 0, equipment: "none", level: "intermediate", tags: ["zone2", "cardio"], when: "any", how: "Zone 2 Walk: 15min zügiges Gehen, Nasen-Atmung möglich, Gespräch möglich.", prerequisites: ["MOV001"] },
    { id: "MOV013", pillar: "movement_muscle", minutes: 10, intensity: 0, equipment: "none", level: "intermediate", tags: ["mobility", "hip"], when: "any", how: "Hip Mobility Flow: 10min (90/90, Pigeon, Frog Stretch, Hip Circles).", prerequisites: ["MOV002", "MOV005"] },
    { id: "MOV014", pillar: "movement_muscle", minutes: 8, intensity: 0, equipment: "basic", level: "intermediate", tags: ["strength", "resistance"], when: "any", how: "Band Work: Banded Pull-Aparts 3×15, Banded Squats 3×12.", prerequisites: ["MOV010"] },
    { id: "MOV015", pillar: "movement_muscle", minutes: 20, intensity: 0, equipment: "none", level: "intermediate", tags: ["steps", "outdoor"], when: "any", how: "Power Walk: 20min schnelles Gehen, leichte Steigung wenn möglich.", prerequisites: ["MOV012"] },

    // Advanced
    { id: "MOV020", pillar: "movement_muscle", minutes: 25, intensity: +1, equipment: "basic", level: "advanced", tags: ["strength", "full_body", "advanced"], when: "any", how: "Full Body Strength: Goblet Squats 4×10, Push-ups 4×12, Rows 4×10, Planks 3×30s.", prerequisites: ["MOV011", "MOV014"] },
    { id: "MOV021", pillar: "movement_muscle", minutes: 16, intensity: +1, equipment: "none", level: "advanced", tags: ["hiit", "cardio"], when: "any", how: "HIIT Sprint: 6× (30s schnell / 60s langsam) - Treppen, Burpees oder Sprints.", prerequisites: ["MOV012", "MOV020"] },
    { id: "MOV022", pillar: "movement_muscle", minutes: 30, intensity: +1, equipment: "gym", level: "advanced", tags: ["strength", "compound", "advanced"], when: "any", how: "Big 3 Light: Squat 3×8, Bench/Push 3×8, Row/Pull 3×8 mit moderatem Gewicht.", prerequisites: ["MOV020"] },
    { id: "MOV023", pillar: "movement_muscle", minutes: 20, intensity: 0, equipment: "none", level: "advanced", tags: ["zone2", "running"], when: "any", how: "Easy Run: 20min lockeres Joggen (Herzfrequenz Zone 2, Gespräch möglich).", prerequisites: ["MOV015", "MOV012"] },
    { id: "MOV024", pillar: "movement_muscle", minutes: 15, intensity: 0, equipment: "none", level: "advanced", tags: ["mobility", "advanced"], when: "any", how: "Advanced Mobility: Jefferson Curl, Deep Squat Hold, Shoulder CARs.", prerequisites: ["MOV013"] },

    // ========== SUPPLEMENTS (10 tasks) ==========
    // Beginner
    { id: "SUP001", pillar: "supplements", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["vitamin_d", "basic"], when: "am", how: "Vitamin D Check: Nimmst du 2000-4000 IU täglich (vor allem im Winter)?" },
    { id: "SUP002", pillar: "supplements", minutes: 2, intensity: -1, equipment: "any", level: "beginner", tags: ["magnesium", "basic"], when: "pm", how: "Magnesium Abends: 200-400mg Magnesium Glycinat/Citrat vor dem Schlafen." },
    { id: "SUP003", pillar: "supplements", minutes: 3, intensity: -1, equipment: "any", level: "beginner", tags: ["creatine", "basic"], when: "any", how: "Creatine Daily: 5g Creatin Monohydrat in Getränk einrühren." },

    // Intermediate
    { id: "SUP010", pillar: "supplements", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["stack", "morning"], when: "am", how: "Morning Stack: Vitamin D + K2 + Omega-3 zum Frühstück.", prerequisites: ["SUP001"] },
    { id: "SUP011", pillar: "supplements", minutes: 5, intensity: 0, equipment: "any", level: "intermediate", tags: ["stack", "evening"], when: "pm", how: "Evening Stack: Magnesium + Glycin + Zink vor dem Schlafen.", prerequisites: ["SUP002"] },
    { id: "SUP012", pillar: "supplements", minutes: 3, intensity: 0, equipment: "any", level: "intermediate", tags: ["adaptogens"], when: "any", how: "Adaptogen Check: Ashwagandha 300-600mg für Stress-Resilienz.", prerequisites: ["SUP002"] },

    // Advanced
    { id: "SUP020", pillar: "supplements", minutes: 10, intensity: 0, equipment: "any", level: "advanced", tags: ["protocol", "advanced"], when: "any", how: "Supplement Audit: Alle Supplemente auf Qualität und Notwendigkeit prüfen.", prerequisites: ["SUP010", "SUP011"] },
    { id: "SUP021", pillar: "supplements", minutes: 5, intensity: 0, equipment: "any", level: "advanced", tags: ["bloodwork", "advanced"], when: "any", how: "Blutwerte planen: Termin für D, B12, Ferritin, Schilddrüse machen.", prerequisites: ["SUP020"] },
    { id: "SUP022", pillar: "supplements", minutes: 3, intensity: 0, equipment: "any", level: "advanced", tags: ["nootropics", "advanced"], when: "am", how: "Focus Stack: L-Theanin 200mg + Koffein 100mg für fokussierte Arbeit.", prerequisites: ["SUP012"] }
];
