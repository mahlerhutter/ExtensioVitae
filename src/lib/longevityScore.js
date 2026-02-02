/**
 * EXTENSIOVITAE — Longevity Score Calculator
 * ==========================================
 *
 * Wissenschaftlich inspirierter Score basierend auf:
 * - Schlafforschung (Walker, Huberman)
 * - Stressforschung (Sapolsky, McGonigal)
 * - Bewegungsstudien (Levine, Attia)
 * - Ernährungsforschung (Sinclair, Longo)
 * - Epigenetik & biologisches Alter (Horvath Clock)
 *
 * NICHT medizinisch validiert - für Motivationszwecke
 */

// ============================================
// LIFE EXPECTANCY BASELINE (Germany 2024)
// ============================================
const BASE_LIFE_EXPECTANCY = {
    male: 78.6,
    female: 83.4
};

// Average weeks in a life
const WEEKS_PER_YEAR = 52;

// ============================================
// RISK FACTOR WEIGHTS (Jahre Differenz)
// ============================================

// Sleep Impact (basierend auf Walker's "Why We Sleep")
const SLEEP_IMPACT = {
    "<6": -4.5,      // Chronischer Schlafmangel: -4-5 Jahre
    "6-6.5": -2.5,   // Suboptimal
    "6.5-7": -1.0,   // Leicht unter optimal
    "7-7.5": 0,      // Optimal für die meisten
    "7.5-8": +0.5,   // Optimal
    ">8": 0          // Kann auf andere Probleme hindeuten
};

// Stress Impact (basierend auf Sapolsky's Forschung)
const STRESS_IMPACT = {
    1: +1.5,   // Sehr niedrig - kann auch Unterforderung sein
    2: +2.0,   // Niedrig - optimal
    3: +1.5,   // Gut
    4: +1.0,   // Akzeptabel
    5: 0,      // Neutral
    6: -0.5,   // Leicht erhöht
    7: -1.5,   // Erhöht
    8: -3.0,   // Hoch - chronischer Stress beginnt
    9: -4.5,   // Sehr hoch
    10: -6.0   // Extrem - massiver Gesundheitsimpact
};

// Training Frequency Impact (basierend auf Attia, Levine)
const TRAINING_IMPACT = {
    "0": -3.5,     // Sedentär: -3-4 Jahre
    "1-2": -0.5,   // Minimal
    "3-4": +2.0,   // Optimal für Langlebigkeit
    "5+": +2.5     // Sehr aktiv (kann auch zu viel sein)
};

// Diet Pattern Impact
const DIET_FACTORS = {
    // Negative
    high_ultra_processed: -2.5,
    high_sugar_snacks: -1.5,
    frequent_alcohol: -2.0,
    late_eating: -1.0,

    // Positive
    mostly_whole_foods: +2.0,
    high_protein_focus: +1.0,
    mediterranean_style: +2.5,
    time_restricted_eating: +1.0
};

// Age adjustment (ältere Menschen profitieren weniger von Änderungen)
function ageAdjustmentFactor(age) {
    if (age < 30) return 1.2;   // Junge Menschen: höherer Impact
    if (age < 40) return 1.1;
    if (age < 50) return 1.0;
    if (age < 60) return 0.9;
    if (age < 70) return 0.75;
    return 0.6;                  // 70+: geringerer aber immer noch wichtiger Impact
}

// ============================================
// MAIN SCORE CALCULATION
// ============================================

/**
 * Berechnet den ExtensioVitae Longevity Score
 * @param {Object} intake - Intake form data
 * @returns {Object} Score details
 */
export function calculateLongevityScore(intake) {
    const {
        age,
        sex = 'male',
        sleep_hours_bucket,
        stress_1_10,
        training_frequency,
        diet_pattern = []
    } = intake;

    // Basis-Lebenserwartung
    const baseExpectancy = BASE_LIFE_EXPECTANCY[sex] || 80;

    // Bereits gelebte Jahre
    const yearsLived = age;
    const weeksLived = Math.round(yearsLived * WEEKS_PER_YEAR);

    // === IMPACT CALCULATIONS ===

    // 1. Sleep Impact
    const sleepImpact = SLEEP_IMPACT[sleep_hours_bucket] ?? 0;

    // 2. Stress Impact
    const stressImpact = STRESS_IMPACT[stress_1_10] ?? 0;

    // 3. Training Impact
    const trainingImpact = TRAINING_IMPACT[training_frequency] ?? 0;

    // 4. Diet Impact
    let dietImpact = 0;
    for (const pattern of diet_pattern) {
        dietImpact += DIET_FACTORS[pattern] ?? 0;
    }
    dietImpact = Math.max(-5, Math.min(5, dietImpact)); // Cap at ±5 years

    // Total lifestyle impact
    const rawLifestyleImpact = sleepImpact + stressImpact + trainingImpact + dietImpact;

    // Apply age adjustment
    const ageFactor = ageAdjustmentFactor(age);
    const adjustedLifestyleImpact = rawLifestyleImpact * ageFactor;

    // === CURRENT TRAJECTORY ===
    const currentExpectancy = baseExpectancy + adjustedLifestyleImpact;
    const currentRemainingYears = Math.max(0, currentExpectancy - age);
    const currentRemainingWeeks = Math.round(currentRemainingYears * WEEKS_PER_YEAR);
    const currentTotalWeeks = weeksLived + currentRemainingWeeks;

    // === OPTIMIZED TRAJECTORY (with ExtensioVitae) ===
    // Assume 60-80% improvement in modifiable factors over 6-12 months
    const optimizationPotential = calculateOptimizationPotential(intake);
    const optimizedExpectancy = baseExpectancy + (optimizationPotential.maxImpact * ageFactor);
    const optimizedRemainingYears = Math.max(0, optimizedExpectancy - age);
    const optimizedRemainingWeeks = Math.round(optimizedRemainingYears * WEEKS_PER_YEAR);
    const optimizedTotalWeeks = weeksLived + optimizedRemainingWeeks;

    // === POTENTIAL GAIN ===
    const potentialGainYears = optimizedExpectancy - currentExpectancy;
    const potentialGainWeeks = Math.round(potentialGainYears * WEEKS_PER_YEAR);

    // === LONGEVITY SCORE (0-100) ===
    // Normalisiert: 0 = sehr schlecht (-10 Jahre), 100 = optimal (+5 Jahre)
    const scoreRaw = ((adjustedLifestyleImpact + 10) / 15) * 100;
    const score = Math.round(Math.max(0, Math.min(100, scoreRaw)));

    // === BIOLOGICAL AGE ESTIMATE ===
    // Vereinfachte Schätzung basierend auf Lifestyle-Faktoren
    const biologicalAgeOffset = -adjustedLifestyleImpact * 0.8; // Umkehrung: negative Impacts = älteres bio. Alter
    const biologicalAge = Math.round(age + biologicalAgeOffset);

    // === SCORE BREAKDOWN ===
    const breakdown = {
        sleep: {
            value: sleep_hours_bucket,
            impact: sleepImpact,
            score: normalizeSubScore(sleepImpact, -4.5, 0.5),
            label: getSleepLabel(sleepImpact),
            improvementTip: getSleepTip(sleep_hours_bucket)
        },
        stress: {
            value: stress_1_10,
            impact: stressImpact,
            score: normalizeSubScore(stressImpact, -6, 2),
            label: getStressLabel(stressImpact),
            improvementTip: getStressTip(stress_1_10)
        },
        movement: {
            value: training_frequency,
            impact: trainingImpact,
            score: normalizeSubScore(trainingImpact, -3.5, 2.5),
            label: getMovementLabel(trainingImpact),
            improvementTip: getMovementTip(training_frequency)
        },
        nutrition: {
            value: diet_pattern,
            impact: dietImpact,
            score: normalizeSubScore(dietImpact, -5, 5),
            label: getNutritionLabel(dietImpact),
            improvementTip: getNutritionTip(diet_pattern)
        }
    };

    return {
        // Main score
        score,
        scoreLabel: getScoreLabel(score),

        // Age metrics
        chronologicalAge: age,
        biologicalAge,
        biologicalAgeDiff: biologicalAge - age,

        // Life expectancy
        baseExpectancy: Math.round(baseExpectancy * 10) / 10,
        currentExpectancy: Math.round(currentExpectancy * 10) / 10,
        optimizedExpectancy: Math.round(optimizedExpectancy * 10) / 10,

        // Weeks visualization
        weeksLived,
        currentRemainingWeeks,
        currentTotalWeeks,
        optimizedRemainingWeeks,
        optimizedTotalWeeks,
        potentialGainWeeks,
        potentialGainYears: Math.round(potentialGainYears * 10) / 10,

        // Breakdown
        breakdown,

        // Impacts
        totalLifestyleImpact: Math.round(adjustedLifestyleImpact * 10) / 10,

        // Metadata
        calculatedAt: new Date().toISOString()
    };
}

// ============================================
// OPTIMIZATION POTENTIAL
// ============================================

function calculateOptimizationPotential(intake) {
    const { sleep_hours_bucket, stress_1_10, training_frequency, diet_pattern = [] } = intake;

    // Calculate max possible improvement for each factor
    const improvements = [];

    // Sleep: potential to reach 7-7.5h
    const currentSleepImpact = SLEEP_IMPACT[sleep_hours_bucket] ?? 0;
    const optimalSleepImpact = SLEEP_IMPACT["7.5-8"];
    if (currentSleepImpact < optimalSleepImpact) {
        improvements.push({
            category: 'sleep',
            potential: (optimalSleepImpact - currentSleepImpact) * 0.7, // 70% achievable
            label: 'Schlafoptimierung'
        });
    }

    // Stress: potential to reach level 3-4
    const currentStressImpact = STRESS_IMPACT[stress_1_10] ?? 0;
    const optimalStressImpact = STRESS_IMPACT[3];
    if (currentStressImpact < optimalStressImpact) {
        improvements.push({
            category: 'stress',
            potential: (optimalStressImpact - currentStressImpact) * 0.5, // 50% achievable (stress is hard)
            label: 'Stressmanagement'
        });
    }

    // Movement: potential to reach 3-4x/week
    const currentTrainingImpact = TRAINING_IMPACT[training_frequency] ?? 0;
    const optimalTrainingImpact = TRAINING_IMPACT["3-4"];
    if (currentTrainingImpact < optimalTrainingImpact) {
        improvements.push({
            category: 'movement',
            potential: (optimalTrainingImpact - currentTrainingImpact) * 0.8, // 80% achievable
            label: 'Mehr Bewegung'
        });
    }

    // Diet: potential improvement
    let currentDietImpact = 0;
    for (const p of diet_pattern) {
        currentDietImpact += DIET_FACTORS[p] ?? 0;
    }
    const optimalDietImpact = 3.5; // Realistic optimal
    if (currentDietImpact < optimalDietImpact) {
        improvements.push({
            category: 'nutrition',
            potential: (optimalDietImpact - currentDietImpact) * 0.6, // 60% achievable
            label: 'Ernährungsumstellung'
        });
    }

    const totalPotential = improvements.reduce((sum, i) => sum + i.potential, 0);
    const maxImpact = currentSleepImpact + currentStressImpact + currentTrainingImpact + currentDietImpact + totalPotential;

    return {
        improvements,
        totalPotential: Math.round(totalPotential * 10) / 10,
        maxImpact: Math.round(maxImpact * 10) / 10
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeSubScore(impact, min, max) {
    const normalized = ((impact - min) / (max - min)) * 100;
    return Math.round(Math.max(0, Math.min(100, normalized)));
}

function getScoreLabel(score) {
    if (score >= 85) return { text: 'Exzellent', color: '#22c55e', emoji: '🌟' };
    if (score >= 70) return { text: 'Sehr gut', color: '#84cc16', emoji: '✨' };
    if (score >= 55) return { text: 'Gut', color: '#eab308', emoji: '👍' };
    if (score >= 40) return { text: 'Ausbaufähig', color: '#f97316', emoji: '📈' };
    if (score >= 25) return { text: 'Verbesserungsbedarf', color: '#ef4444', emoji: '⚠️' };
    return { text: 'Kritisch', color: '#dc2626', emoji: '🚨' };
}

function getSleepLabel(impact) {
    if (impact >= 0) return 'Optimal';
    if (impact >= -1) return 'Gut';
    if (impact >= -2.5) return 'Suboptimal';
    return 'Kritisch';
}

function getStressLabel(impact) {
    if (impact >= 1.5) return 'Niedrig';
    if (impact >= 0) return 'Moderat';
    if (impact >= -1.5) return 'Erhöht';
    if (impact >= -3) return 'Hoch';
    return 'Chronisch';
}

function getMovementLabel(impact) {
    if (impact >= 2) return 'Sehr aktiv';
    if (impact >= 0) return 'Aktiv';
    if (impact >= -1) return 'Wenig aktiv';
    return 'Sedentär';
}

function getNutritionLabel(impact) {
    if (impact >= 2) return 'Sehr gesund';
    if (impact >= 0) return 'Ausgewogen';
    if (impact >= -2) return 'Verbesserungswürdig';
    return 'Ungesund';
}

function getSleepTip(bucket) {
    const tips = {
        "<6": "Priorität #1: Schlafenszeit 30min früher legen",
        "6-6.5": "Ziel: 7h erreichen durch feste Schlafenszeit",
        "6.5-7": "Fast optimal - Schlafhygiene verfeinern",
        "7-7.5": "Sehr gut - Qualität optimieren",
        "7.5-8": "Optimal - beibehalten!",
        ">8": "Schlafqualität prüfen (zu viel kann auf Probleme hindeuten)"
    };
    return tips[bucket] || "Schlafgewohnheiten evaluieren";
}

function getStressTip(level) {
    if (level <= 3) return "Stress gut im Griff - Routinen beibehalten";
    if (level <= 5) return "Regelmäßige Pausen und Atemübungen einbauen";
    if (level <= 7) return "Aktives Stressmanagement starten (Meditation, Natur)";
    return "Dringend: Stressquellen identifizieren und professionelle Hilfe erwägen";
}

function getMovementTip(freq) {
    const tips = {
        "0": "Mit 10-Minuten-Walks starten - jede Bewegung zählt",
        "1-2": "Auf 3x/Woche steigern mit leichtem Krafttraining",
        "3-4": "Optimal! Zone 2 Cardio und Krafttraining kombinieren",
        "5+": "Auf Regeneration achten - Qualität vor Quantität"
    };
    return tips[freq] || "Bewegung in den Alltag integrieren";
}

function getNutritionTip(patterns) {
    if (patterns.includes('high_ultra_processed')) {
        return "Verarbeitete Lebensmittel schrittweise durch Vollwertkost ersetzen";
    }
    if (patterns.includes('high_sugar_snacks')) {
        return "Zucker-Snacks durch Protein-Snacks ersetzen";
    }
    if (patterns.includes('frequent_alcohol')) {
        return "Alkoholfreie Tage einführen (mind. 4/Woche)";
    }
    if (patterns.includes('late_eating')) {
        return "Letzte Mahlzeit 3h vor dem Schlafen";
    }
    return "Mehr Protein und Gemüse bei jeder Mahlzeit";
}

// ============================================
// LIFE IN WEEKS VISUALIZATION DATA
// ============================================

/**
 * Generiert Daten für die "Life in Weeks" Visualisierung
 * @param {Object} scoreData - Output von calculateLongevityScore
 * @returns {Object} Visualization data
 */
export function generateLifeInWeeksData(scoreData) {
    const {
        chronologicalAge,
        weeksLived,
        currentRemainingWeeks,
        optimizedRemainingWeeks,
        potentialGainWeeks
    } = scoreData;

    // Standard 90 Jahre als Referenz-Grid
    const REFERENCE_YEARS = 90;
    const TOTAL_REFERENCE_WEEKS = REFERENCE_YEARS * WEEKS_PER_YEAR; // 4680

    // Weeks per row (1 row = 1 year)
    const WEEKS_PER_ROW = 52;
    const TOTAL_ROWS = REFERENCE_YEARS;

    // Generate week data
    const weeks = [];

    for (let i = 0; i < TOTAL_REFERENCE_WEEKS; i++) {
        const year = Math.floor(i / WEEKS_PER_ROW);
        const weekInYear = i % WEEKS_PER_ROW;

        let status;
        let color;

        if (i < weeksLived) {
            // Already lived
            status = 'lived';
            color = '#1e3a5f'; // Navy - gelebt
        } else if (i < weeksLived + currentRemainingWeeks) {
            // Current trajectory
            status = 'current';
            color = '#64748b'; // Slate - aktuelle Prognose
        } else if (i < weeksLived + optimizedRemainingWeeks) {
            // Potential gain with ExtensioVitae
            status = 'potential';
            color = '#C9A227'; // Gold - Potenzial
        } else {
            // Beyond projection
            status = 'beyond';
            color = '#e2e8f0'; // Light gray
        }

        weeks.push({
            index: i,
            year,
            weekInYear,
            status,
            color
        });
    }

    // Summary stats
    const summary = {
        totalWeeksInGrid: TOTAL_REFERENCE_WEEKS,
        weeksLived,
        weeksLivedPercent: Math.round((weeksLived / TOTAL_REFERENCE_WEEKS) * 100),
        currentProjection: weeksLived + currentRemainingWeeks,
        currentProjectionYears: Math.round((weeksLived + currentRemainingWeeks) / WEEKS_PER_ROW),
        optimizedProjection: weeksLived + optimizedRemainingWeeks,
        optimizedProjectionYears: Math.round((weeksLived + optimizedRemainingWeeks) / WEEKS_PER_ROW),
        potentialGainWeeks,
        potentialGainYears: Math.round(potentialGainWeeks / WEEKS_PER_ROW * 10) / 10
    };

    // Milestone markers
    const milestones = [
        { year: 18, label: 'Volljährig' },
        { year: 30, label: '30' },
        { year: 40, label: '40' },
        { year: 50, label: '50' },
        { year: 60, label: '60' },
        { year: 65, label: 'Rente' },
        { year: 70, label: '70' },
        { year: 80, label: '80' },
        { year: 90, label: '90' }
    ].filter(m => m.year <= REFERENCE_YEARS);

    return {
        weeks,
        summary,
        milestones,
        config: {
            weeksPerRow: WEEKS_PER_ROW,
            totalRows: TOTAL_ROWS,
            referenceYears: REFERENCE_YEARS
        }
    };
}

// ============================================
// QUICK SCORE (für Landing Page ohne volle Intake)
// ============================================

/**
 * Schneller Score basierend auf wenigen Inputs (für Landing Page)
 */
export function calculateQuickScore({ age, sleepHours, stressLevel, exerciseFrequency }) {
    // Simplified mapping
    const sleepBucket =
        sleepHours < 6 ? "<6" :
        sleepHours < 6.5 ? "6-6.5" :
        sleepHours < 7 ? "6.5-7" :
        sleepHours < 7.5 ? "7-7.5" :
        sleepHours < 8 ? "7.5-8" : ">8";

    const trainingFreq =
        exerciseFrequency === 0 ? "0" :
        exerciseFrequency <= 2 ? "1-2" :
        exerciseFrequency <= 4 ? "3-4" : "5+";

    const intake = {
        age,
        sex: 'male', // Default
        sleep_hours_bucket: sleepBucket,
        stress_1_10: stressLevel,
        training_frequency: trainingFreq,
        diet_pattern: []
    };

    return calculateLongevityScore(intake);
}

export default {
    calculateLongevityScore,
    generateLifeInWeeksData,
    calculateQuickScore
};
