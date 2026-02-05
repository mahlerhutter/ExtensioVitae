/**
 * Fasting Window Service
 * Calculates optimal eating windows based on wake time and calendar events
 */

/**
 * Calculate optimal fasting window based on wake time
 * @param {string} wakeTime - Wake time in HH:MM format (24h)
 * @param {Array} calendarEvents - Optional calendar events that might shift the window
 * @returns {Object} Fasting window with eating window and fasting period
 */
export function getFastingWindow(wakeTime, calendarEvents = []) {
    const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number)

    // Default 16:8 fasting protocol
    // Eating window: 8 hours starting 2-3 hours after wake
    const eatingWindowStart = addHours(wakeHour, wakeMinute, 2.5)
    const eatingWindowEnd = addHours(eatingWindowStart.hour, eatingWindowStart.minute, 8)

    // Check for dinner meetings or social events
    const eveningEvents = findEveningEvents(calendarEvents)
    let adjustedWindow = { start: eatingWindowStart, end: eatingWindowEnd }

    if (eveningEvents.length > 0) {
        // Shift eating window to accommodate dinner
        const latestEvent = eveningEvents[eveningEvents.length - 1]
        const eventHour = new Date(latestEvent.start).getHours()

        if (eventHour > eatingWindowEnd.hour) {
            // Extend eating window to include dinner
            adjustedWindow.end = { hour: eventHour + 2, minute: 0 }
            // Adjust start to maintain 8-hour window
            adjustedWindow.start = addHours(adjustedWindow.end.hour, adjustedWindow.end.minute, -8)
        }
    }

    return {
        protocol: '16:8',
        eatingWindow: {
            start: formatTime(adjustedWindow.start),
            end: formatTime(adjustedWindow.end),
            duration: 8
        },
        fastingWindow: {
            start: formatTime(adjustedWindow.end),
            end: formatTime(adjustedWindow.start),
            duration: 16
        },
        recommendation: getRecommendation(adjustedWindow),
        adjusted: eveningEvents.length > 0
    }
}

/**
 * Get fasting protocols with different durations
 */
export function getFastingProtocols() {
    return {
        '16:8': {
            name: '16:8 Intermittent Fasting',
            fastingHours: 16,
            eatingHours: 8,
            difficulty: 'Beginner',
            benefits: ['Weight management', 'Metabolic health', 'Cellular repair'],
            description: 'Most popular and sustainable fasting protocol'
        },
        '18:6': {
            name: '18:6 Extended Fast',
            fastingHours: 18,
            eatingHours: 6,
            difficulty: 'Intermediate',
            benefits: ['Enhanced autophagy', 'Deeper ketosis', 'Fat burning'],
            description: 'More aggressive fat burning and cellular cleanup'
        },
        '20:4': {
            name: '20:4 Warrior Diet',
            fastingHours: 20,
            eatingHours: 4,
            difficulty: 'Advanced',
            benefits: ['Maximum autophagy', 'HGH boost', 'Mental clarity'],
            description: 'One main meal per day, maximum metabolic benefits'
        },
        '23:1': {
            name: '23:1 OMAD (One Meal A Day)',
            fastingHours: 23,
            eatingHours: 1,
            difficulty: 'Expert',
            benefits: ['Peak autophagy', 'Extreme fat loss', 'Longevity'],
            description: 'Single daily meal, advanced practitioners only'
        }
    }
}

/**
 * Calculate eating window for custom fasting protocol
 */
export function getCustomFastingWindow(wakeTime, fastingHours, calendarEvents = []) {
    const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number)
    const eatingHours = 24 - fastingHours

    // Start eating window 2-3 hours after wake
    const eatingWindowStart = addHours(wakeHour, wakeMinute, 2.5)
    const eatingWindowEnd = addHours(eatingWindowStart.hour, eatingWindowStart.minute, eatingHours)

    return {
        protocol: `${fastingHours}:${eatingHours}`,
        eatingWindow: {
            start: formatTime(eatingWindowStart),
            end: formatTime(eatingWindowEnd),
            duration: eatingHours
        },
        fastingWindow: {
            start: formatTime(eatingWindowEnd),
            end: formatTime(eatingWindowStart),
            duration: fastingHours
        }
    }
}

/**
 * Get meal timing recommendations within eating window
 */
export function getMealTimings(eatingWindow) {
    const start = parseTime(eatingWindow.start)
    const end = parseTime(eatingWindow.end)
    const duration = eatingWindow.duration

    if (duration >= 8) {
        // 3 meals
        return {
            breakfast: formatTime(start),
            lunch: formatTime(addHours(start.hour, start.minute, duration / 2)),
            dinner: formatTime(addHours(start.hour, start.minute, duration - 1.5))
        }
    } else if (duration >= 6) {
        // 2 meals
        return {
            meal1: formatTime(addHours(start.hour, start.minute, 1)),
            meal2: formatTime(addHours(start.hour, start.minute, duration - 1.5))
        }
    } else {
        // 1 meal
        return {
            meal: formatTime(addHours(start.hour, start.minute, duration / 2))
        }
    }
}

// Helper functions
function addHours(hour, minute, hoursToAdd) {
    const totalMinutes = (hour * 60 + minute) + (hoursToAdd * 60)
    return {
        hour: Math.floor(totalMinutes / 60) % 24,
        minute: Math.floor(totalMinutes % 60)
    }
}

function formatTime({ hour, minute }) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parseTime(timeString) {
    const [hour, minute] = timeString.split(':').map(Number)
    return { hour, minute }
}

function findEveningEvents(events) {
    return events.filter(event => {
        const hour = new Date(event.start).getHours()
        return hour >= 18 && hour <= 22 // 6 PM - 10 PM
    })
}

function getRecommendation(window) {
    const startHour = window.start.hour
    const endHour = window.end.hour

    if (startHour < 10 && endHour < 18) {
        return 'Optimal: Early eating window supports circadian rhythm'
    } else if (startHour >= 12 && endHour >= 20) {
        return 'Late window: May impact sleep quality. Consider shifting earlier.'
    } else {
        return 'Balanced: Good alignment with typical daily schedule'
    }
}
