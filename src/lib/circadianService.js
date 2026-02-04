/**
 * Circadian Intelligence Service
 * 
 * Calculates biological windows based on solar timing and user patterns.
 * Premium logic for the "Intelligence Layer" (v0.4.0)
 */

// Default: Berlin coordinates
const DEFAULT_LAT = 52.52;
const DEFAULT_LON = 13.40;

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
