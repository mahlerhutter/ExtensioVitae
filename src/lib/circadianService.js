/**
 * Circadian Intelligence Service
 *
 * Calculates biological windows based on solar timing and user patterns.
 * Premium logic for the "Intelligence Layer" (v0.4.0)
 * Enhanced with Wake-Time Light Protocol (BLOCK A)
 */

// Default: Berlin coordinates
const DEFAULT_LAT = 52.52;
const DEFAULT_LON = 13.40;

/**
 * LightWindow data structure
 * @typedef {Object} LightWindow
 * @property {Date} start - Window start time
 * @property {Date} end - Window end time
 * @property {string} type - 'morning' | 'evening'
 * @property {string} label - Human-readable label
 */

/**
 * CircadianRecommendation data structure
 * @typedef {Object} CircadianRecommendation
 * @property {LightWindow} window - The light window
 * @property {string} intensity - Recommended light intensity
 * @property {number} duration - Recommended duration in minutes
 * @property {string} reason - Scientific reasoning
 */

/**
 * Gets solar times (simple approximation)
 * In a production environment, use 'suncalc' library.
 */
export function getSolarTimes(lat = DEFAULT_LAT, lon = DEFAULT_LON, date = new Date()) {
    const hour = date.getHours();

    // For MVP: Return reasonable defaults based on typical seasons
    // In a full implementation, we'd use the solar elevation formula.
    return {
        sunrise: 6, // 6:00 AM
        sunset: 18, // 6:00 PM
        isDaylight: hour >= 6 && hour < 18
    };
}

/**
 * Computes the Circadian Status
 */
export function getCircadianIntelligence(userProfile = {}) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeDecimal = hour + minute / 60;

    // 1. Determine baseline from solar times
    const { sunrise, sunset } = getSolarTimes();

    // 2. Define Dynamic Windows
    const windows = {
        morningLight: {
            start: sunrise,
            end: sunrise + 1.5, // 90 min window
            label: 'Morning Light Optimization',
            status: 'Active',
            action: 'View sunlight for 10-20 min'
        },
        deepWork: {
            start: sunrise + 2,
            end: sunrise + 5,
            label: 'Peak Cognitive Window',
            status: 'Optimal',
            action: 'High-focus work only'
        },
        blueLightCutoff: {
            start: sunset - 2, // 2 hours before sunset
            end: sunset + 4,
            label: 'Sleep Pressure Phase',
            status: 'Critical',
            action: 'Enable Red-Shift / Blue Blockers'
        }
    };

    // 3. Determine current phase
    let currentPhase = 'Baseline';
    let activeWindow = null;

    if (timeDecimal >= windows.morningLight.start && timeDecimal <= windows.morningLight.end) {
        currentPhase = 'Morning Pulse';
        activeWindow = windows.morningLight;
    } else if (timeDecimal >= windows.deepWork.start && timeDecimal <= windows.deepWork.end) {
        currentPhase = 'Flow State';
        activeWindow = windows.deepWork;
    } else if (timeDecimal >= windows.blueLightCutoff.start || timeDecimal < sunrise) {
        currentPhase = 'Melatonin Onset';
        activeWindow = windows.blueLightCutoff;
    }

    return {
        timeDecimal,
        currentPhase,
        activeWindow,
        allWindows: windows,
        sunPath: (timeDecimal / 24) * 100 // Percentage for visualization
    };
}

/**
 * Determines if Melatonin Guard should be active
 */
export function shouldActivateMelatoninGuard(userProfile = {}) {
    const intel = getCircadianIntelligence(userProfile);
    // Activate if we are in the Blue Light Cutoff phase or after midnight before sunrise
    return intel.currentPhase === 'Melatonin Onset';
}

// ============================================================================
// BLOCK A: Wake-Time Based Circadian Light Protocol
// ============================================================================

/**
 * Calculate optimal light exposure windows based on wake time
 *
 * @param {Date|string} wakeTime - User's wake time (Date object or "HH:MM" string)
 * @param {Object} location - { lat, lon } coordinates
 * @returns {Object} Circadian windows with recommendations
 */
export function getCircadianWindow(wakeTime, location = {}) {
    const lat = location.lat || DEFAULT_LAT;
    const lon = location.lon || DEFAULT_LON;
    const now = new Date();

    // Parse wake time
    let wakeDate;
    if (typeof wakeTime === 'string') {
        const [hours, minutes] = wakeTime.split(':').map(Number);
        wakeDate = new Date();
        wakeDate.setHours(hours, minutes, 0, 0);
    } else {
        wakeDate = new Date(wakeTime);
    }

    // Get solar times for context
    const solar = getSolarTimes(lat, lon, now);
    const sunrise = new Date();
    sunrise.setHours(solar.sunrise, 0, 0, 0);

    // Calculate morning light window: 30-90 min after wake time
    const morningLightStart = new Date(wakeDate);
    morningLightStart.setMinutes(morningLightStart.getMinutes() + 30);

    const morningLightEnd = new Date(wakeDate);
    morningLightEnd.setMinutes(morningLightEnd.getMinutes() + 90);

    // Calculate bedtime (assuming 16 hours awake)
    const bedtime = new Date(wakeDate);
    bedtime.setHours(bedtime.getHours() + 16);

    // Blue light cutoff: 2-3 hours before bedtime
    const blueLightCutoff = new Date(bedtime);
    blueLightCutoff.setHours(blueLightCutoff.getHours() - 2.5);

    return {
        morningLightStart,
        morningLightEnd,
        blueLightCutoff,
        bedtime,
        sunrise,
        wakeTime: wakeDate,
        location: { lat, lon }
    };
}

/**
 * Get personalized circadian recommendations based on wake time
 *
 * @param {Date|string} wakeTime - User's wake time
 * @param {Object} location - Optional location coordinates
 * @returns {CircadianRecommendation[]} Array of recommendations
 */
export function getCircadianRecommendations(wakeTime, location = {}) {
    const windows = getCircadianWindow(wakeTime, location);
    const now = new Date();

    const recommendations = [];

    // Morning Light Recommendation
    const morningWindow = {
        start: windows.morningLightStart,
        end: windows.morningLightEnd,
        type: 'morning',
        label: 'Morning Light Window'
    };

    recommendations.push({
        window: morningWindow,
        intensity: '10,000 lux or bright sunlight',
        duration: 20, // 20 minutes minimum
        reason: 'Anchors circadian rhythm, suppresses morning melatonin, boosts cortisol awakening response',
        isActive: now >= morningWindow.start && now <= morningWindow.end,
        priority: 'high'
    });

    // Evening Blue Light Recommendation
    const eveningWindow = {
        start: windows.blueLightCutoff,
        end: windows.bedtime,
        type: 'evening',
        label: 'Blue Light Restriction Window'
    };

    recommendations.push({
        window: eveningWindow,
        intensity: 'Dim, warm light (<300 lux, >2700K)',
        duration: null, // Until bedtime
        reason: 'Prevents melatonin suppression, preserves sleep pressure, optimizes sleep onset',
        isActive: now >= eveningWindow.start,
        priority: now >= eveningWindow.start ? 'critical' : 'medium'
    });

    // Midday light boost (optional, if indoors)
    const middayStart = new Date(windows.wakeTime);
    middayStart.setHours(middayStart.getHours() + 4);

    const middayEnd = new Date(windows.wakeTime);
    middayEnd.setHours(middayEnd.getHours() + 6);

    const middayWindow = {
        start: middayStart,
        end: middayEnd,
        type: 'midday',
        label: 'Midday Light Boost'
    };

    recommendations.push({
        window: middayWindow,
        intensity: 'Bright light or brief outdoor exposure',
        duration: 10,
        reason: 'Reinforces circadian signal, maintains alertness, supports mood',
        isActive: now >= middayWindow.start && now <= middayWindow.end,
        priority: 'low'
    });

    return recommendations;
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time (HH:MM)
 */
export function formatTime(date) {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get current active circadian phase
 * @param {Date|string} wakeTime - User's wake time
 * @returns {Object} Current phase info
 */
export function getCurrentCircadianPhase(wakeTime) {
    const recommendations = getCircadianRecommendations(wakeTime);
    const activeRec = recommendations.find(rec => rec.isActive);

    if (!activeRec) {
        return {
            phase: 'baseline',
            label: 'Baseline',
            icon: '🌍',
            recommendation: null
        };
    }

    const phaseMap = {
        morning: {
            phase: 'morning_light',
            label: 'Morning Light Window',
            icon: '☀️',
            color: 'amber'
        },
        evening: {
            phase: 'blue_light_cutoff',
            label: 'Blue Light Restriction',
            icon: '🌙',
            color: 'purple'
        },
        midday: {
            phase: 'midday_boost',
            label: 'Midday Boost',
            icon: '💡',
            color: 'cyan'
        }
    };

    const phaseInfo = phaseMap[activeRec.window.type] || phaseMap.baseline;

    return {
        ...phaseInfo,
        recommendation: activeRec,
        timeRemaining: Math.max(0, Math.ceil((activeRec.window.end - new Date()) / (1000 * 60)))
    };
}
