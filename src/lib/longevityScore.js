/**
 * EXTENSIOVITAE — Longevity Score Calculator (v2.0)
 * ==================================================
 *
 * WISSENSCHAFTLICHE GRUNDLAGEN:
 *
 * 1. SCHLAF - Meta-Analysen zeigen:
 *    - Cappuccio et al. (2010): <6h = +12% Mortalitätsrisiko
 *    - Yin et al. (2017): 7-8h optimal, J-Kurve bei >9h
 *    - Walker (2017): Chronischer Schlafmangel = -4-5 Jahre
 *
 * 2. STRESS - Chronischer Stress:
 *    - Kivimäki et al. (2012): Job strain = +23% CVD-Risiko
 *    - Steptoe & Kivimäki (2012): Cortisol → Telomerverkürzung
 *    - Chida & Steptoe (2008): Positiver Affekt = -18% Mortalität
 *
 * 3. BEWEGUNG - Wen et al. (2011), Moore et al. (2012):
 *    - 15 min/Tag = +3 Jahre
 *    - 150 min/Woche = -31% Mortalität
 *    - Sedentäres Verhalten = eigenständiger Risikofaktor
 *
 * 4. ERNÄHRUNG - Aune et al. (2017), Micha et al. (2017):
 *    - Ultra-processed foods = +62% Mortalität (Hall, 2019)
 *    - Mediterranean Diet = -25% CVD (PREDIMED)
 *    - Alkohol: J-Kurve, aber >14 Drinks/Woche = exponentiell schädlich
 *
 * 5. BMI/KÖRPERKOMPOSITION - Global BMI Consortium (2016):
 *    - BMI 22.5-25 optimal
 *    - Waist-to-Height Ratio besser als BMI allein
 *
 * 6. RAUCHEN - Doll et al. (2004):
 *    - Raucher sterben ~10 Jahre früher
 *    - Aufhören vor 40: 90% des Risikos reversibel
 *
 * 7. SOZIALE VERBINDUNGEN - Holt-Lunstad et al. (2010):
 *    - Einsamkeit = +26% Mortalitätsrisiko
 *    - Stärke wie Rauchen, stärker als Inaktivität
 *
 * DISCLAIMER: Dies ist KEINE medizinische Diagnose.
 * Dient ausschließlich der Motivation und Selbstreflexion.
 */

// ============================================
// LIFE EXPECTANCY BASELINE (Deutschland 2024)
// ============================================
const BASE_LIFE_EXPECTANCY = {
    male: 78.6,
    female: 83.4,
    diverse: 80.5
};

const WEEKS_PER_YEAR = 52;

// ============================================
// WISSENSCHAFTLICH KALIBRIERTE RISK FACTORS
// ============================================

/**
 * SCHLAF (basierend auf Cappuccio 2010, Walker 2017)
 * Referenz: 7-8h = neutral, alles andere relativ dazu
 */
const SLEEP_IMPACT = {
    "<6": -4.0,       // Cappuccio: 12% erhöhte Mortalität ≈ -4 Jahre
    "6-6.5": -2.0,    // Suboptimal
    "6.5-7": -0.8,    // Leicht unter optimal
    "7-7.5": 0,       // Optimal für die meisten Erwachsenen
    "7.5-8": +0.3,    // Optimal +0.3 Jahre (basierend auf Meta-Analyse von Yin et al. 2017)
    "8-8.5": 0,       // Noch ok
    ">8": -0.5        // J-Kurve: >9h assoziiert mit erhöhter Mortalität
};

/**
 * STRESS (basierend auf Kivimäki 2012, Steptoe 2012)
 * 1-10 Skala: chronischer Stress beschleunigt Alterung messbar
 */
const STRESS_IMPACT = {
    1: +1.2,    // Sehr niedrig - kann auch Unterforderung bedeuten
    2: +1.5,    // Optimal - Eustress
    3: +1.2,    // Gut managebar
    4: +0.8,    // Akzeptabel
    5: 0,       // Neutral/durchschnittlich
    6: -0.8,    // Leicht erhöht
    7: -1.8,    // Moderat erhöht
    8: -3.0,    // Hoch - chronischer Stress Territory
    9: -4.5,    // Sehr hoch - messbarer Gesundheitsimpact
    10: -6.0    // Burnout-Level - massiver Impact
};

/**
 * TRAINING FREQUENZ (basierend auf Wen 2011, Moore 2012)
 * 150 min moderate oder 75 min intensive Aktivität/Woche = Ziel
 */
const TRAINING_IMPACT = {
    "0": -3.5,      // Sedentär: Meta-Analysen zeigen -3-4 Jahre
    "1-2": +0.5,    // Minimal - immer noch besser als nichts
    "3-4": +2.5,    // Sweet Spot für Langlebigkeit (150-300 min/Woche)
    "5+": +2.8      // Sehr aktiv - diminishing returns, aber noch positiv
};

/**
 * ERNÄHRUNGSMUSTER (basierend auf Aune 2017, PREDIMED)
 */
const DIET_FACTORS = {
    // Negative Faktoren
    high_ultra_processed: -2.5,   // Hall 2019: +62% Mortalität
    high_sugar_snacks: -1.2,      // Glykämische Last → Inflammation
    frequent_alcohol: -1.5,       // >7 Drinks/Woche = linear schädlich
    late_eating: -0.8,            // Circadian disruption, Metabolismus

    // Positive Faktoren
    mostly_whole_foods: +1.8,     // Basis für alle "Blue Zone" Diäten
    high_protein_focus: +0.8,     // Muskelerhalt, Sättigung
    mediterranean_style: +2.5,    // PREDIMED: -30% CVD
    time_restricted_eating: +0.8  // Metabolische Vorteile (Panda et al.)
};

/**
 * BMI IMPACT (Global BMI Consortium 2016)
 * J-förmige Kurve: <18.5 und >30 erhöht Risiko
 */
function calculateBMIImpact(heightCm, weightKg) {
    if (!heightCm || !weightKg) return 0;

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // BMI-Mortality J-Kurve (Global BMI Consortium)
    if (bmi < 18.5) return -1.5;      // Untergewicht - erhöhtes Risiko
    if (bmi < 22.5) return +0.3;      // Optimal-unterer Bereich
    if (bmi < 25) return 0;           // Normalgewicht
    if (bmi < 27.5) return -0.5;      // Leichtes Übergewicht
    if (bmi < 30) return -1.2;        // Übergewicht
    if (bmi < 35) return -2.5;        // Adipositas Grad 1
    if (bmi < 40) return -4.0;        // Adipositas Grad 2
    return -5.5;                       // Adipositas Grad 3
}

/**
 * RAUCHEN (Doll et al. 2004, Jha et al. 2013)
 * Raucher verlieren im Schnitt 10 Jahre
 */
const SMOKING_IMPACT = {
    never: 0,
    former: -1.5,       // Ehemals: teilweise reversibel (-1.5 Jahre vs. Baseline)
    occasional: -3.0,   // Gelegentlich: messbar schädlich
    daily: -8.0         // Täglich: ~10 Jahre weniger (Doll 2004) - konservativ mit -8 berechnet
};

/**
 * ALKOHOL (Wood et al. 2018, GBD 2016)
 * Kein "sicherer" Level, aber Dosis-Wirkungs-Beziehung
 */
const ALCOHOL_IMPACT = {
    never: +0.5,        // Leichter Vorteil vs. moderate Trinker
    rarely: +0.3,       // <1x/Woche
    weekly: 0,          // 1-2x/Woche - baseline
    several: -1.0,      // 3-5x/Woche
    daily: -2.5         // Täglich - erheblicher Impact
};

/**
 * SOZIALE VERBINDUNGEN (Holt-Lunstad 2010)
 * Einsamkeit ist stärkerer Prädiktor als Inaktivität
 */
const SOCIAL_CONNECTION_IMPACT = {
    isolated: -3.5,      // Einsamkeit = +26% Mortalität
    limited: -1.5,       // Wenige Kontakte
    moderate: 0,         // Durchschnitt
    strong: +1.5,        // Gutes soziales Netz
    very_strong: +2.0    // Starke Community-Einbindung
};

/**
 * CIRCADIAN ALIGNMENT (Roenneberg 2012, Wright 2013)
 * Sozialer Jetlag kostet Gesundheit
 */
const CIRCADIAN_IMPACT = {
    aligned: +0.8,      // Natürlicher Rhythmus, früh schlafen (+0.8 Jahre Vorteil)
    moderate: 0,        // Durchschnitt
    misaligned: -1.2,   // Schichtarbeit, spätes Zubettgehen (-1.2 Jahre)
    severe: -2.0        // Chronischer Jetlag, wechselnde Schichten
};

/**
 * ALTER-MODIFIKATOR
 * Jüngere Menschen haben mehr Zeit zur Korrektur
 */
function ageAdjustmentFactor(age) {
    if (age < 30) return 1.15;   // Hoher Impact möglich
    if (age < 40) return 1.10;
    if (age < 50) return 1.0;    // Baseline
    if (age < 60) return 0.90;
    if (age < 70) return 0.75;
    return 0.60;                  // 70+: geringerer aber wichtiger Impact
}

// ============================================
// HAUPTBERECHNUNG
// ============================================

/**
 * Berechnet den ExtensioVitae Longevity Score
 * @param {Object} intake - Intake form data
 * @returns {Object} Score details
 */
export function calculateLongevityScore(intake) {
    const {
        age: ageInput,
        sex = 'male',
        height_cm: heightInput,
        weight_kg: weightInput,
        sleep_hours_bucket,
        stress_1_10,
        training_frequency,
        diet_pattern = [],
        smoking_status = 'never',
        alcohol_frequency = 'weekly',
        social_connection = 'moderate',
        circadian_alignment = 'moderate',
        wake_time
    } = intake;

    // Ensure numeric values
    const age = Number(ageInput);
    const height_cm = Number(heightInput);
    const weight_kg = Number(weightInput);

    // Basis-Lebenserwartung
    const baseExpectancy = BASE_LIFE_EXPECTANCY[sex] || 80;
    const yearsLived = age;
    const weeksLived = Math.round(yearsLived * WEEKS_PER_YEAR);

    // === IMPACT CALCULATIONS ===

    // 1. Sleep Impact
    const sleepImpact = SLEEP_IMPACT[sleep_hours_bucket] ?? 0;

    // 2. Stress Impact
    const stressImpact = STRESS_IMPACT[stress_1_10] ?? 0;

    // 3. Training Impact
    const trainingImpact = TRAINING_IMPACT[training_frequency] ?? 0;

    // 4. Diet Impact (capped)
    let dietImpact = 0;
    for (const pattern of diet_pattern) {
        dietImpact += DIET_FACTORS[pattern] ?? 0;
    }
    dietImpact = Math.max(-5, Math.min(5, dietImpact));

    // 5. BMI Impact (if data available)
    const bmiImpact = calculateBMIImpact(height_cm, weight_kg);

    // 6. Smoking Impact
    const smokingImpact = SMOKING_IMPACT[smoking_status] ?? 0;

    // 7. Alcohol Impact
    const alcoholImpact = ALCOHOL_IMPACT[alcohol_frequency] ?? 0;

    // 8. Social Connection Impact
    const socialImpact = SOCIAL_CONNECTION_IMPACT[social_connection] ?? 0;

    // 9. Circadian Impact (inferred from wake_time or explicit)
    let circadianImpact = CIRCADIAN_IMPACT[circadian_alignment] ?? 0;
    if (wake_time && !circadian_alignment) {
        // Infer from wake time
        const hour = parseInt(wake_time.split(':')[0]);
        if (hour >= 5 && hour <= 7) circadianImpact = CIRCADIAN_IMPACT.aligned;
        else if (hour >= 7 && hour <= 9) circadianImpact = CIRCADIAN_IMPACT.moderate;
        else circadianImpact = CIRCADIAN_IMPACT.misaligned;
    }

    // Total raw lifestyle impact
    const rawLifestyleImpact =
        sleepImpact +
        stressImpact +
        trainingImpact +
        dietImpact +
        bmiImpact +
        smokingImpact +
        alcoholImpact +
        socialImpact +
        circadianImpact;

    // Apply age adjustment
    const ageFactor = ageAdjustmentFactor(age);
    const adjustedLifestyleImpact = rawLifestyleImpact * ageFactor;

    // === CURRENT TRAJECTORY ===
    const currentExpectancy = baseExpectancy + adjustedLifestyleImpact;
    const currentRemainingYears = Math.max(0, currentExpectancy - age);
    const currentRemainingWeeks = Math.round(currentRemainingYears * WEEKS_PER_YEAR);
    const currentTotalWeeks = weeksLived + currentRemainingWeeks;

    // === OPTIMIZED TRAJECTORY ===
    const optimizationPotential = calculateOptimizationPotential(intake, ageFactor);
    const optimizedExpectancy = baseExpectancy + optimizationPotential.maxImpact;
    const optimizedRemainingYears = Math.max(0, optimizedExpectancy - age);
    const optimizedRemainingWeeks = Math.round(optimizedRemainingYears * WEEKS_PER_YEAR);
    const optimizedTotalWeeks = weeksLived + optimizedRemainingWeeks;

    // === POTENTIAL GAIN ===
    const potentialGainYears = optimizedExpectancy - currentExpectancy;
    const potentialGainWeeks = Math.round(potentialGainYears * WEEKS_PER_YEAR);

    // === LONGEVITY SCORE (0-100) ===
    // Normalisiert: 0 = sehr schlecht (-15 Jahre), 100 = optimal (+8 Jahre)
    const scoreRaw = ((adjustedLifestyleImpact + 15) / 23) * 100;
    const score = Math.round(Math.max(0, Math.min(100, scoreRaw)));

    // === BIOLOGICAL AGE ESTIMATE ===
    // === BIOLOGICAL AGE ESTIMATE ===
    const biologicalAgeOffset = -adjustedLifestyleImpact * 0.75; // 0.75 relates lifestyle impact years to biological age shift (conservative estimate)
    // Guard against negative/unrealistic values
    const biologicalAgeRaw = age + biologicalAgeOffset;
    const biologicalAge = Math.max(18, Math.round(biologicalAgeRaw));

    // === SCORE BREAKDOWN ===
    const breakdown = {
        sleep: {
            value: sleep_hours_bucket,
            impact: sleepImpact,
            score: normalizeSubScore(sleepImpact, -4, 0.5),
            label: getSleepLabel(sleepImpact),
            improvementTip: getSleepTip(sleep_hours_bucket),
            evidence: 'Cappuccio et al. 2010, Walker 2017'
        },
        stress: {
            value: stress_1_10,
            impact: stressImpact,
            score: normalizeSubScore(stressImpact, -6, 2),
            label: getStressLabel(stressImpact),
            improvementTip: getStressTip(stress_1_10),
            evidence: 'Kivimäki et al. 2012, Steptoe & Kivimäki 2012'
        },
        movement: {
            value: training_frequency,
            impact: trainingImpact,
            score: normalizeSubScore(trainingImpact, -3.5, 3),
            label: getMovementLabel(trainingImpact),
            improvementTip: getMovementTip(training_frequency),
            evidence: 'Wen et al. 2011, Moore et al. 2012'
        },
        nutrition: {
            value: diet_pattern,
            impact: dietImpact,
            score: normalizeSubScore(dietImpact, -5, 5),
            label: getNutritionLabel(dietImpact),
            improvementTip: getNutritionTip(diet_pattern),
            evidence: 'Aune et al. 2017, PREDIMED Trial'
        },
        bodyComposition: {
            value: { height_cm, weight_kg },
            impact: bmiImpact,
            score: normalizeSubScore(bmiImpact, -5, 0.5),
            label: getBMILabel(bmiImpact),
            improvementTip: getBMITip(height_cm, weight_kg),
            evidence: 'Global BMI Mortality Collaboration 2016'
        },
        smoking: {
            value: smoking_status,
            impact: smokingImpact,
            score: normalizeSubScore(smokingImpact, -8, 0),
            label: getSmokingLabel(smokingImpact),
            improvementTip: getSmokingTip(smoking_status),
            evidence: 'Doll et al. 2004, Jha et al. 2013'
        },
        alcohol: {
            value: alcohol_frequency,
            impact: alcoholImpact,
            score: normalizeSubScore(alcoholImpact, -2.5, 0.5),
            label: getAlcoholLabel(alcoholImpact),
            improvementTip: getAlcoholTip(alcohol_frequency),
            evidence: 'Wood et al. 2018, GBD 2016'
        },
        socialConnection: {
            value: social_connection,
            impact: socialImpact,
            score: normalizeSubScore(socialImpact, -3.5, 2),
            label: getSocialLabel(socialImpact),
            improvementTip: getSocialTip(social_connection),
            evidence: 'Holt-Lunstad et al. 2010'
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
        rawImpacts: {
            sleep: sleepImpact,
            stress: stressImpact,
            training: trainingImpact,
            diet: dietImpact,
            bmi: bmiImpact,
            smoking: smokingImpact,
            alcohol: alcoholImpact,
            social: socialImpact,
            circadian: circadianImpact
        },

        // Metadata
        version: '2.0',
        calculatedAt: new Date().toISOString()
    };
}

// ============================================
// OPTIMIZATION POTENTIAL
// ============================================

function calculateOptimizationPotential(intake, ageFactor) {
    const {
        sleep_hours_bucket,
        stress_1_10,
        training_frequency,
        diet_pattern = [],
        smoking_status = 'never',
        alcohol_frequency = 'weekly',
        social_connection = 'moderate'
    } = intake;

    const improvements = [];

    // Sleep
    const currentSleepImpact = SLEEP_IMPACT[sleep_hours_bucket] ?? 0;
    const optimalSleepImpact = SLEEP_IMPACT["7.5-8"];
    if (currentSleepImpact < optimalSleepImpact) {
        improvements.push({
            category: 'sleep',
            potential: (optimalSleepImpact - currentSleepImpact) * 0.7 * ageFactor,
            label: 'Schlafoptimierung'
        });
    }

    // Stress
    const currentStressImpact = STRESS_IMPACT[stress_1_10] ?? 0;
    const optimalStressImpact = STRESS_IMPACT[2];
    if (currentStressImpact < optimalStressImpact) {
        improvements.push({
            category: 'stress',
            potential: (optimalStressImpact - currentStressImpact) * 0.5 * ageFactor,
            label: 'Stressmanagement'
        });
    }

    // Movement
    const currentTrainingImpact = TRAINING_IMPACT[training_frequency] ?? 0;
    const optimalTrainingImpact = TRAINING_IMPACT["3-4"];
    if (currentTrainingImpact < optimalTrainingImpact) {
        improvements.push({
            category: 'movement',
            potential: (optimalTrainingImpact - currentTrainingImpact) * 0.8 * ageFactor,
            label: 'Mehr Bewegung'
        });
    }

    // Diet
    let currentDietImpact = 0;
    for (const p of diet_pattern) {
        currentDietImpact += DIET_FACTORS[p] ?? 0;
    }
    const optimalDietImpact = 3.5;
    if (currentDietImpact < optimalDietImpact) {
        improvements.push({
            category: 'nutrition',
            potential: (optimalDietImpact - currentDietImpact) * 0.6 * ageFactor,
            label: 'Ernährungsumstellung'
        });
    }

    // Smoking - biggest potential if smoker
    const currentSmokingImpact = SMOKING_IMPACT[smoking_status] ?? 0;
    if (currentSmokingImpact < 0) {
        improvements.push({
            category: 'smoking',
            potential: (-currentSmokingImpact) * 0.9 * ageFactor, // Quitting is very achievable
            label: 'Rauchstopp'
        });
    }

    // Alcohol
    const currentAlcoholImpact = ALCOHOL_IMPACT[alcohol_frequency] ?? 0;
    if (currentAlcoholImpact < 0) {
        improvements.push({
            category: 'alcohol',
            potential: (-currentAlcoholImpact) * 0.7 * ageFactor,
            label: 'Alkoholreduktion'
        });
    }

    // Social connection
    const currentSocialImpact = SOCIAL_CONNECTION_IMPACT[social_connection] ?? 0;
    const optimalSocialImpact = SOCIAL_CONNECTION_IMPACT.strong;
    if (currentSocialImpact < optimalSocialImpact) {
        improvements.push({
            category: 'social',
            potential: (optimalSocialImpact - currentSocialImpact) * 0.5 * ageFactor,
            label: 'Soziale Verbindungen'
        });
    }

    const totalPotential = improvements.reduce((sum, i) => sum + i.potential, 0);

    // Calculate what max impact would be
    const currentTotal =
        (SLEEP_IMPACT[sleep_hours_bucket] ?? 0) +
        (STRESS_IMPACT[stress_1_10] ?? 0) +
        (TRAINING_IMPACT[training_frequency] ?? 0) +
        currentDietImpact +
        currentSmokingImpact +
        currentAlcoholImpact +
        currentSocialImpact;

    const maxImpact = (currentTotal + totalPotential) * ageFactor;

    return {
        improvements: improvements.sort((a, b) => b.potential - a.potential),
        totalPotential: Math.round(totalPotential * 10) / 10,
        maxImpact: Math.round(maxImpact * 10) / 10
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeSubScore(impact, min, max) {
    // Guard against zero division
    if (min === max) {
        return 50; // Default to neutral if range is invalid
    }
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
    if (impact >= -2) return 'Suboptimal';
    return 'Kritisch';
}

function getStressLabel(impact) {
    if (impact >= 1.0) return 'Niedrig';
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

function getBMILabel(impact) {
    if (impact >= 0) return 'Optimal';
    if (impact >= -1) return 'Gut';
    if (impact >= -2.5) return 'Leicht erhöht';
    return 'Handlungsbedarf';
}

function getSmokingLabel(impact) {
    if (impact === 0) return 'Nichtraucher';
    if (impact >= -2) return 'Ehemaliger Raucher';
    if (impact >= -5) return 'Gelegentlich';
    return 'Täglich';
}

function getAlcoholLabel(impact) {
    if (impact >= 0) return 'Moderat';
    if (impact >= -1) return 'Gelegentlich erhöht';
    return 'Häufig';
}

function getSocialLabel(impact) {
    if (impact >= 1) return 'Stark vernetzt';
    if (impact >= 0) return 'Gut';
    if (impact >= -1.5) return 'Ausbaufähig';
    return 'Isoliert';
}

// Tips
function getSleepTip(bucket) {
    const tips = {
        "<6": "Priorität #1: Schlafenszeit 30min früher legen",
        "6-6.5": "Ziel: 7h erreichen durch feste Schlafenszeit",
        "6.5-7": "Fast optimal - Schlafhygiene verfeinern",
        "7-7.5": "Sehr gut - Qualität optimieren",
        "7.5-8": "Optimal - beibehalten!",
        "8-8.5": "Gut - auf Schlafqualität achten",
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
    if (!patterns || patterns.length === 0) return "Mehr Protein und Gemüse bei jeder Mahlzeit";
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

function getBMITip(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) return "Gewicht und Größe tracken für bessere Einschätzung";
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5) return "Leicht untergewichtig - auf ausreichend Protein achten";
    if (bmi < 25) return "Guter Bereich - weiter so!";
    if (bmi < 30) return "Leichtes Übergewicht - Fokus auf Bewegung und Ernährung";
    return "Gewichtsreduktion priorisieren - ärztliche Beratung empfohlen";
}

function getSmokingTip(status) {
    const tips = {
        never: "Weiter so - Nichtrauchen ist der größte Einzelfaktor für Langlebigkeit",
        former: "Großartig, dass Sie aufgehört haben! Risiko sinkt jedes Jahr weiter",
        occasional: "Jede Zigarette weniger zählt - Reduktion als erstes Ziel",
        daily: "Rauchstopp = +10 Jahre Lebenserwartung. Beratung/Nikotinersatz nutzen"
    };
    return tips[status] || "Rauchen ist der vermeidbarste Risikofaktor";
}

function getAlcoholTip(freq) {
    const tips = {
        never: "Gut so - Alkohol hat keinen gesundheitlichen Nutzen",
        rarely: "Moderater Konsum - weiter so",
        weekly: "Im Rahmen - auf alkoholfreie Tage achten",
        several: "Konsum reduzieren - max. 2 Drinks pro Anlass",
        daily: "Täglicher Konsum ist riskant - alkoholfreie Tage einführen"
    };
    return tips[freq] || "Alkohol bewusst konsumieren";
}

function getSocialTip(connection) {
    const tips = {
        isolated: "Soziale Kontakte aktiv aufbauen - Vereine, Gruppen, Nachbarn",
        limited: "Bestehende Kontakte pflegen, neue suchen",
        moderate: "Gut - regelmäßige soziale Aktivitäten einplanen",
        strong: "Sehr gut - soziales Netz ist Schutzfaktor",
        very_strong: "Exzellent - Community ist stärkster Langlebigkeitsfaktor"
    };
    return tips[connection] || "Soziale Verbindungen sind messbar lebensverlängernd";
}

// ============================================
// LIFE IN WEEKS VISUALIZATION
// ============================================

export function generateLifeInWeeksData(scoreData) {
    const {
        chronologicalAge,
        weeksLived,
        currentRemainingWeeks,
        optimizedRemainingWeeks,
        potentialGainWeeks
    } = scoreData;

    const REFERENCE_YEARS = 90;
    const TOTAL_REFERENCE_WEEKS = REFERENCE_YEARS * WEEKS_PER_YEAR;
    const WEEKS_PER_ROW = 52;
    const TOTAL_ROWS = REFERENCE_YEARS;

    const weeks = [];

    for (let i = 0; i < TOTAL_REFERENCE_WEEKS; i++) {
        const year = Math.floor(i / WEEKS_PER_ROW);
        const weekInYear = i % WEEKS_PER_ROW;

        let status;
        let color;

        if (i < weeksLived) {
            status = 'lived';
            color = '#1e3a5f';
        } else if (i < weeksLived + currentRemainingWeeks) {
            status = 'current';
            color = '#64748b';
        } else if (i < weeksLived + optimizedRemainingWeeks) {
            status = 'potential';
            color = '#C9A227';
        } else {
            status = 'beyond';
            color = '#e2e8f0';
        }

        weeks.push({
            index: i,
            year,
            weekInYear,
            status,
            color
        });
    }

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
// QUICK SCORE (für Landing Page)
// ============================================

export function calculateQuickScore({ age, sleepHours, stressLevel, exerciseFrequency }) {
    const sleepBucket =
        sleepHours < 6 ? "<6" :
            sleepHours < 6.5 ? "6-6.5" :
                sleepHours < 7 ? "6.5-7" :
                    sleepHours < 7.5 ? "7-7.5" :
                        sleepHours < 8 ? "7.5-8" :
                            sleepHours < 8.5 ? "8-8.5" : ">8";

    const trainingFreq =
        exerciseFrequency === 0 ? "0" :
            exerciseFrequency <= 2 ? "1-2" :
                exerciseFrequency <= 4 ? "3-4" : "5+";

    const intake = {
        age,
        sex: 'male',
        sleep_hours_bucket: sleepBucket,
        stress_1_10: stressLevel,
        training_frequency: trainingFreq,
        diet_pattern: [],
        smoking_status: 'never',
        alcohol_frequency: 'weekly',
        social_connection: 'moderate'
    };

    return calculateLongevityScore(intake);
}

export default {
    calculateLongevityScore,
    generateLifeInWeeksData,
    calculateQuickScore
};
