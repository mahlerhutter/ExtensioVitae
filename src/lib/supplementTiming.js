/**
 * Supplement Timing Optimizer (BLOCK C)
 *
 * Science-backed timing rules for optimal supplement absorption and efficacy
 * Integrates with Biological Inventory System (v0.8.0) and Circadian Service
 *
 * References:
 * - Fat-soluble vitamins: Best with meals containing fats
 * - Magnesium: Evening for sleep support (NMDA antagonist)
 * - B-vitamins: Morning for energy (ATP production)
 * - Zinc: Evening on empty stomach for optimal absorption
 */

/**
 * @typedef {Object} SupplementTimingRule
 * @property {string} timeOfDay - 'morning' | 'afternoon' | 'evening' | 'bedtime'
 * @property {boolean} withFood - Should be taken with food
 * @property {string} reason - Scientific explanation
 * @property {number} offsetFromWake - Minutes after wake time (for morning) or before bed (for evening)
 * @property {string[]} interactions - Supplements to avoid taking together
 * @property {string} foodType - Preferred food type ('any', 'high-fat', 'empty-stomach')
 */

/**
 * @typedef {Object} OptimalTiming
 * @property {string} supplement - Supplement name
 * @property {Date} time - Optimal time to take
 * @property {string} reason - Why this timing
 * @property {boolean} withFood - Should be taken with food
 * @property {string} foodType - Preferred food type
 * @property {string} timeOfDay - General time category
 */

/**
 * Supplement Timing Rules Database
 * Based on pharmacokinetics and chronobiology research
 */
export const SUPPLEMENT_TIMING_RULES = {
    // Fat-Soluble Vitamins
    'vitamin-d': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble vitamin. Morning timing prevents potential sleep interference. Absorption increased 50% with dietary fat.',
        offsetFromWake: 60, // 1 hour after wake (with breakfast)
        interactions: ['calcium'], // High calcium can reduce absorption
        priority: 'high'
    },
    'vitamin_d3': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble vitamin. Morning timing prevents potential sleep interference. Absorption increased 50% with dietary fat.',
        offsetFromWake: 60,
        interactions: ['calcium'],
        priority: 'high'
    },
    'vitamin-a': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble. Best absorbed with dietary fat.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'medium'
    },
    'vitamin-e': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble antioxidant. Take with largest meal for optimal absorption.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'medium'
    },
    'vitamin-k': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble. Critical for bone health and blood clotting.',
        offsetFromWake: 60,
        interactions: ['blood-thinners'],
        priority: 'medium'
    },

    // Water-Soluble Vitamins
    'vitamin-c': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Water-soluble antioxidant. Split dose for sustained levels. Morning supports immune function.',
        offsetFromWake: 30,
        interactions: [],
        priority: 'high'
    },
    'vitamin_c': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Water-soluble antioxidant. Split dose for sustained levels. Morning supports immune function.',
        offsetFromWake: 30,
        interactions: [],
        priority: 'high'
    },

    // B-Complex (Energy Boost)
    'b-complex': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'any',
        reason: 'B-vitamins support energy metabolism and ATP production. Morning timing prevents evening energy spike.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'high'
    },
    'b_complex': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'any',
        reason: 'B-vitamins support energy metabolism and ATP production. Morning timing prevents evening energy spike.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'high'
    },
    'vitamin-b12': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Better absorption on empty stomach. Supports energy and cognitive function.',
        offsetFromWake: 0, // Immediately upon waking
        interactions: [],
        priority: 'medium'
    },

    // Minerals
    'magnesium': {
        timeOfDay: 'evening',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'NMDA antagonist promotes relaxation and sleep. Glycinate form best for sleep. Take 1-2h before bed.',
        offsetFromWake: 900, // 15 hours after wake (evening)
        interactions: ['calcium', 'zinc'],
        priority: 'high'
    },
    'zinc': {
        timeOfDay: 'evening',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Better absorption on empty stomach. Evening timing supports immune function and testosterone production during sleep.',
        offsetFromWake: 900, // 15 hours after wake
        interactions: ['copper', 'iron'],
        priority: 'high'
    },
    'calcium': {
        timeOfDay: 'evening',
        withFood: true,
        foodType: 'any',
        reason: 'Supports bone remodeling during sleep. Take separate from magnesium and iron.',
        offsetFromWake: 840, // 14 hours after wake
        interactions: ['magnesium', 'iron', 'zinc'],
        priority: 'medium'
    },
    'iron': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Best absorbed on empty stomach with vitamin C. Avoid with calcium, magnesium, or tea/coffee.',
        offsetFromWake: 0,
        interactions: ['calcium', 'magnesium', 'zinc'],
        priority: 'medium'
    },

    // Omega-3 Fatty Acids
    'omega-3': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Best absorbed with largest meal containing fats. Supports heart, brain, and inflammatory response.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'high'
    },
    'omega_3': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Best absorbed with largest meal containing fats. Supports heart, brain, and inflammatory response.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'high'
    },
    'fish-oil': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'high-fat',
        reason: 'Fat-soluble. Take with breakfast to minimize fishy aftertaste.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'high'
    },

    // Sleep & Relaxation
    'melatonin': {
        timeOfDay: 'bedtime',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Endogenous sleep hormone. Take 30-60 min before target sleep time. Low dose (0.3-1mg) often sufficient.',
        offsetFromWake: 960, // 16 hours after wake (bedtime)
        interactions: [],
        priority: 'critical'
    },
    'l-theanine': {
        timeOfDay: 'evening',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Promotes relaxation without sedation. Pairs well with magnesium for sleep.',
        offsetFromWake: 900,
        interactions: [],
        priority: 'medium'
    },

    // Probiotics & Digestive
    'probiotics': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Empty stomach allows better survival through stomach acid. Take 30 min before breakfast.',
        offsetFromWake: 30,
        interactions: ['antibiotics'],
        priority: 'medium'
    },
    'digestive-enzymes': {
        timeOfDay: 'morning',
        withFood: true,
        foodType: 'any',
        reason: 'Take immediately before meals for optimal digestive support.',
        offsetFromWake: 60,
        interactions: [],
        priority: 'low'
    },

    // Electrolytes
    'electrolytes': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Rehydrate after overnight fast. Supports hydration and mineral balance.',
        offsetFromWake: 0, // Immediately upon waking
        interactions: [],
        priority: 'medium'
    },

    // Collagen & Protein
    'collagen': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Amino acids best absorbed on empty stomach. Morning timing supports protein synthesis.',
        offsetFromWake: 0,
        interactions: [],
        priority: 'low'
    },

    // Adaptogens
    'ashwagandha': {
        timeOfDay: 'evening',
        withFood: true,
        foodType: 'any',
        reason: 'Adaptogen that reduces cortisol. Evening timing supports sleep and recovery.',
        offsetFromWake: 840,
        interactions: [],
        priority: 'medium'
    },
    'rhodiola': {
        timeOfDay: 'morning',
        withFood: false,
        foodType: 'empty-stomach',
        reason: 'Stimulating adaptogen. Morning timing prevents sleep disruption.',
        offsetFromWake: 0,
        interactions: [],
        priority: 'low'
    }
};

/**
 * Get optimal supplement timings based on wake time
 *
 * @param {Date|string} wakeTime - User's wake time (Date or "HH:MM")
 * @param {string[]} supplements - Array of supplement slugs
 * @returns {OptimalTiming[]} Array of optimal timing recommendations
 */
export function getOptimalTimings(wakeTime, supplements) {
    // Parse wake time
    let wakeDate;
    if (typeof wakeTime === 'string') {
        const [hours, minutes] = wakeTime.split(':').map(Number);
        wakeDate = new Date();
        wakeDate.setHours(hours, minutes, 0, 0);
    } else {
        wakeDate = new Date(wakeTime);
    }

    const timings = [];

    supplements.forEach(supplementSlug => {
        const rule = SUPPLEMENT_TIMING_RULES[supplementSlug];

        if (!rule) {
            // No specific rule, default to morning with food
            const defaultTime = new Date(wakeDate);
            defaultTime.setMinutes(defaultTime.getMinutes() + 60);

            timings.push({
                supplement: supplementSlug,
                time: defaultTime,
                reason: 'No specific timing rule. Default to morning with breakfast.',
                withFood: true,
                foodType: 'any',
                timeOfDay: 'morning',
                priority: 'low'
            });
            return;
        }

        // Calculate optimal time based on offset
        const optimalTime = new Date(wakeDate);
        optimalTime.setMinutes(optimalTime.getMinutes() + rule.offsetFromWake);

        timings.push({
            supplement: supplementSlug,
            time: optimalTime,
            reason: rule.reason,
            withFood: rule.withFood,
            foodType: rule.foodType,
            timeOfDay: rule.timeOfDay,
            interactions: rule.interactions || [],
            priority: rule.priority
        });
    });

    // Sort by time
    timings.sort((a, b) => a.time - b.time);

    return timings;
}

/**
 * Group supplements by timing window
 *
 * @param {OptimalTiming[]} timings - Array of supplement timings
 * @returns {Object} Grouped by time of day
 */
export function groupSupplementsByTiming(timings) {
    const grouped = {
        morning: [],
        afternoon: [],
        evening: [],
        bedtime: []
    };

    timings.forEach(timing => {
        const category = timing.timeOfDay;
        if (grouped[category]) {
            grouped[category].push(timing);
        } else {
            grouped.morning.push(timing); // Default fallback
        }
    });

    return grouped;
}

/**
 * Check for timing conflicts (interactions)
 *
 * @param {OptimalTiming[]} timings - Array of supplement timings
 * @returns {Object[]} Array of potential conflicts
 */
export function checkTimingConflicts(timings) {
    const conflicts = [];

    timings.forEach((timing, idx) => {
        timing.interactions?.forEach(interaction => {
            // Check if interaction supplement is taken within 2 hours
            const conflictingSupps = timings.filter((t, i) => {
                if (i === idx) return false;
                const timeDiff = Math.abs(t.time - timing.time) / (1000 * 60); // minutes
                return timeDiff < 120 && t.supplement.includes(interaction);
            });

            if (conflictingSupps.length > 0) {
                conflicts.push({
                    supplement1: timing.supplement,
                    supplement2: conflictingSupps[0].supplement,
                    reason: `${timing.supplement} may interfere with ${conflictingSupps[0].supplement} absorption`,
                    recommendation: 'Space these supplements at least 2 hours apart'
                });
            }
        });
    });

    return conflicts;
}

/**
 * Format time for display
 * @param {Date} time - Time to format
 * @returns {string} Formatted time (HH:MM)
 */
export function formatSupplementTime(time) {
    if (!time) return '--:--';
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get supplement display name from slug
 * @param {string} slug - Supplement slug
 * @returns {string} Display name
 */
export function getSupplementDisplayName(slug) {
    const names = {
        'vitamin-d': 'Vitamin D',
        'vitamin_d3': 'Vitamin D3',
        'vitamin-c': 'Vitamin C',
        'vitamin_c': 'Vitamin C',
        'b-complex': 'B-Komplex',
        'b_complex': 'B-Komplex',
        'omega-3': 'Omega-3',
        'omega_3': 'Omega-3',
        'magnesium': 'Magnesium',
        'zinc': 'Zink',
        'melatonin': 'Melatonin',
        'probiotics': 'Probiotika',
        'electrolytes': 'Elektrolyte',
        'collagen': 'Kollagen'
    };

    return names[slug] || slug.replace(/-/g, ' ').replace(/_/g, ' ');
}
