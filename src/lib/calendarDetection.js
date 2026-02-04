/**
 * Calendar Event Detection Logic
 * Detects flights, focus blocks, busy weeks, etc.
 */

import { MODES } from './modeTypes';

/**
 * Detect if an event is a flight
 * @param {object} event - Calendar event
 * @returns {object|null} Detection result or null
 */
export function detectFlight(event) {
    const title = event.title.toLowerCase();
    const location = (event.location || '').toLowerCase();
    const description = (event.description || '').toLowerCase();

    // Keywords that indicate a flight
    const flightKeywords = [
        'flight', 'flug', 'vol', 'vuelo',
        '✈️', '🛫', '🛬',
        'boarding', 'departure', 'arrival',
        'airline', 'airways', 'lufthansa', 'united', 'delta'
    ];

    // Airport code pattern (3 capital letters)
    const airportCodePattern = /\b[A-Z]{3}\b/g;

    // Check for keywords
    const hasKeyword = flightKeywords.some(keyword =>
        title.includes(keyword) ||
        location.includes(keyword) ||
        description.includes(keyword)
    );

    // Check for airport codes
    const titleCodes = title.match(airportCodePattern) || [];
    const locationCodes = location.match(airportCodePattern) || [];
    const hasAirportCode = titleCodes.length > 0 || locationCodes.length > 0;

    // Determine confidence
    let confidence = 0;
    if (hasKeyword && hasAirportCode) {
        confidence = 0.95; // Very confident
    } else if (hasKeyword) {
        confidence = 0.75; // Likely a flight
    } else if (hasAirportCode && titleCodes.length >= 2) {
        confidence = 0.70; // Two airport codes, probably a flight
    }

    if (confidence > 0) {
        // Activate Travel Mode 24 hours before flight
        const triggerTime = new Date(event.start_time);
        triggerTime.setHours(triggerTime.getHours() - 24);

        return {
            type: 'flight',
            confidence,
            trigger_time: triggerTime.toISOString(),
            mode: MODES.TRAVEL,
            metadata: {
                airport_codes: [...titleCodes, ...locationCodes],
                keywords_found: flightKeywords.filter(k =>
                    title.includes(k) || location.includes(k) || description.includes(k)
                )
            }
        };
    }

    return null;
}

/**
 * Detect if an event is a focus block (4+ hours)
 * @param {object} event - Calendar event
 * @returns {object|null} Detection result or null
 */
export function detectFocusBlock(event) {
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Must be at least 4 hours
    if (durationHours < 4) return null;

    const title = event.title.toLowerCase();
    const description = (event.description || '').toLowerCase();

    // Keywords that indicate deep work
    const focusKeywords = [
        'focus', 'deep work', 'writing', 'coding', 'programming',
        'research', 'analysis', 'design', 'strategy',
        'no meetings', 'do not disturb', 'dnd',
        'concentration', 'thinking', 'planning'
    ];

    const hasFocusKeyword = focusKeywords.some(keyword =>
        title.includes(keyword) || description.includes(keyword)
    );

    // Check if it's a meeting (has attendees)
    const isMeeting = event.attendees && event.attendees.length > 0;

    // Determine confidence
    let confidence = 0;
    if (hasFocusKeyword && !isMeeting) {
        confidence = 0.90; // Very confident
    } else if (hasFocusKeyword) {
        confidence = 0.70; // Has keyword but also has attendees
    } else if (durationHours >= 6 && !isMeeting) {
        confidence = 0.60; // Very long block, no attendees
    }

    if (confidence > 0) {
        return {
            type: 'focus_block',
            confidence,
            trigger_time: event.start_time,
            mode: MODES.DEEP_WORK,
            metadata: {
                duration_hours: durationHours,
                has_attendees: isMeeting,
                keywords_found: focusKeywords.filter(k =>
                    title.includes(k) || description.includes(k)
                )
            }
        };
    }

    return null;
}

/**
 * Detect busy week (3+ meetings per day for 3+ days)
 * @param {Array} events - Array of calendar events
 * @param {Date} weekStart - Start of week to analyze
 * @returns {object|null} Detection result or null
 */
export function detectBusyWeek(events, weekStart = new Date()) {
    // Group events by day
    const eventsByDay = {};

    events.forEach(event => {
        const eventDate = new Date(event.start_time);
        const dayKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!eventsByDay[dayKey]) {
            eventsByDay[dayKey] = [];
        }

        // Only count events with attendees (meetings)
        if (event.attendees && event.attendees.length > 0) {
            eventsByDay[dayKey].push(event);
        }
    });

    // Count days with 3+ meetings
    const busyDays = Object.entries(eventsByDay).filter(
        ([day, dayEvents]) => dayEvents.length >= 3
    );

    // Need at least 3 busy days to be a "busy week"
    if (busyDays.length >= 3) {
        const totalMeetings = busyDays.reduce(
            (sum, [day, dayEvents]) => sum + dayEvents.length,
            0
        );

        return {
            type: 'busy_week',
            confidence: 0.85,
            trigger_time: weekStart.toISOString(),
            mode: null, // Don't auto-activate mode, just alert
            metadata: {
                busy_days_count: busyDays.length,
                total_meetings: totalMeetings,
                average_meetings_per_day: (totalMeetings / busyDays.length).toFixed(1),
                busy_days: busyDays.map(([day, dayEvents]) => ({
                    date: day,
                    meeting_count: dayEvents.length
                }))
            },
            alert: {
                title: 'High Stress Week Detected',
                message: `You have ${busyDays.length} busy days with ${totalMeetings} total meetings this week.`,
                suggestion: 'Consider scheduling recovery time and prioritizing sleep.'
            }
        };
    }

    return null;
}

/**
 * Detect doctor/health appointments
 * @param {object} event - Calendar event
 * @returns {object|null} Detection result or null
 */
export function detectDoctorAppointment(event) {
    const title = event.title.toLowerCase();
    const location = (event.location || '').toLowerCase();
    const description = (event.description || '').toLowerCase();

    const healthKeywords = [
        'doctor', 'arzt', 'médecin', 'dr.',
        'dentist', 'zahnarzt',
        'checkup', 'check-up', 'vorsorge',
        'hospital', 'krankenhaus', 'klinik', 'clinic',
        'appointment', 'termin',
        'blood test', 'bluttest', 'lab',
        'physical', 'examination'
    ];

    const hasHealthKeyword = healthKeywords.some(keyword =>
        title.includes(keyword) ||
        location.includes(keyword) ||
        description.includes(keyword)
    );

    if (hasHealthKeyword) {
        return {
            type: 'doctor_appointment',
            confidence: 0.80,
            trigger_time: null, // Don't auto-activate mode
            mode: null,
            metadata: {
                keywords_found: healthKeywords.filter(k =>
                    title.includes(k) || location.includes(k) || description.includes(k)
                )
            },
            alert: {
                title: 'Health Appointment Detected',
                message: 'Would you like to track this in your health profile?',
                action: 'track_health_appointment'
            }
        };
    }

    return null;
}

/**
 * Run all detections on an event
 * @param {object} event - Calendar event
 * @returns {Array} Array of detections
 */
export function detectAll(event) {
    const detections = [];

    const flight = detectFlight(event);
    if (flight) detections.push(flight);

    const focusBlock = detectFocusBlock(event);
    if (focusBlock) detections.push(focusBlock);

    const doctor = detectDoctorAppointment(event);
    if (doctor) detections.push(doctor);

    return detections;
}

/**
 * Run busy week detection on multiple events
 * @param {Array} events - Array of calendar events
 * @returns {object|null} Detection result or null
 */
export function detectBusyWeekFromEvents(events) {
    return detectBusyWeek(events);
}

/**
 * Get detection summary for UI display
 * @param {object} detection - Detection result
 * @returns {object} UI-friendly summary
 */
export function getDetectionSummary(detection) {
    const summaries = {
        flight: {
            icon: '✈️',
            title: 'Flight Detected',
            color: 'blue',
            action: 'Activate Travel Mode'
        },
        focus_block: {
            icon: '🎯',
            title: 'Focus Block Detected',
            color: 'purple',
            action: 'Activate Deep Work Mode'
        },
        busy_week: {
            icon: '📅',
            title: 'Busy Week Detected',
            color: 'orange',
            action: 'View Details'
        },
        doctor_appointment: {
            icon: '🩺',
            title: 'Health Appointment',
            color: 'green',
            action: 'Track in Profile'
        }
    };

    return summaries[detection.type] || {
        icon: '📌',
        title: 'Event Detected',
        color: 'gray',
        action: 'View Details'
    };
}
