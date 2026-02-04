/**
 * Predictive Context Engine (v0.7.0)
 *
 * "The Observer" - Background intelligence that scans calendar and context
 * to proactively suggest/activate protocols BEFORE the user needs them.
 *
 * Philosophy: "Execution over Education" (AX-3)
 * The user shouldn't learn how to manage jet lag. The app does it.
 *
 * Implements:
 * - Flight Detection → Jet Lag Killer (24h before)
 * - Focus Detection → Flow State Stack (2h+ blocks)
 * - Late-Night Detection → Sleep Guard (events ending after 20:00)
 * - Bio-Fulfillment Bridge (inventory check for supplements)
 *
 * @module predictiveService
 */

import { activateProtocol } from './dataService';
import { PROTOCOL_PACKS } from './protocolPacks';
import { logger } from './logger';

// ============================================
// DETECTION PATTERNS
// ============================================

/**
 * Flight detection keywords
 */
const FLIGHT_KEYWORDS = [
    // Airlines
    'flight', 'flug', 'lh', 'ua', 'ba', 'lufthansa', 'united', 'american airlines', 'delta',
    // Airports
    'airport', 'flughafen', 'fra', 'jfk', 'lax', 'lhr', 'cdg', 'sfo', 'ord',
    // Flight-related
    'boarding', 'gate', 'departure', 'arrival', 'abflug', 'ankunft', 'terminal'
];

/**
 * Focus/Deep Work keywords
 */
const FOCUS_KEYWORDS = [
    'deep work', 'focus time', 'konzentration', 'coding', 'writing', 'strategy', 'strategie',
    'planning', 'planung', 'meeting-free', 'no meetings', 'blocked', 'focus block', 'flow'
];

/**
 * Late-night event keywords (events that might disrupt sleep)
 */
const LATE_NIGHT_KEYWORDS = [
    'dinner', 'abendessen', 'drinks', 'party', 'event', 'networking', 'gala',
    'reception', 'empfang', 'theater', 'concert', 'show'
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Detect flight in calendar events
 * @param {Array} events - Calendar events
 * @param {Date} now - Current time
 * @returns {Object|null} Detection result
 */
function detectFlight(events, now = new Date()) {
    for (const event of events) {
        const eventStart = new Date(event.start);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

        // Check if event is within 24-48 hours
        if (hoursUntilEvent > 0 && hoursUntilEvent <= 48) {
            const title = (event.title || event.summary || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            const combinedText = `${title} ${description}`;

            // Check for flight keywords
            if (FLIGHT_KEYWORDS.some(keyword => combinedText.includes(keyword))) {
                return {
                    type: 'flight',
                    event,
                    hoursUntil: Math.round(hoursUntilEvent),
                    confidence: 'high',
                    protocolId: 'jet_lag_west', // or 'jet_lag_east' based on destination
                    reason: `Flug erkannt: "${event.title}" in ${Math.round(hoursUntilEvent)}h`,
                    action: 'activate',
                    priority: 'critical',
                    bioRequirements: ['melatonin', 'electrolytes', 'magnesium']
                };
            }
        }
    }
    return null;
}

/**
 * Detect deep work blocks in calendar
 * @param {Array} events - Calendar events
 * @param {Date} now - Current time
 * @returns {Object|null} Detection result
 */
function detectDeepWorkBlock(events, now = new Date()) {
    for (const event of events) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const durationHours = (eventEnd - eventStart) / (1000 * 60 * 60);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);

        // Check if event is today and duration > 2 hours
        if (hoursUntilEvent > 0 && hoursUntilEvent <= 24 && durationHours >= 2) {
            const title = (event.title || event.summary || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            const combinedText = `${title} ${description}`;

            // Check for focus keywords
            if (FOCUS_KEYWORDS.some(keyword => combinedText.includes(keyword))) {
                return {
                    type: 'deep_work',
                    event,
                    hoursUntil: Math.round(hoursUntilEvent),
                    duration: durationHours,
                    confidence: 'high',
                    protocolId: 'deep_work',
                    reason: `${Math.round(durationHours)}h Focus-Block erkannt: "${event.title}"`,
                    action: 'suggest',
                    priority: 'high',
                    bioRequirements: ['caffeine', 'l-theanine', 'alpha-gpc']
                };
            }

            // Also detect by title patterns (e.g., "Focus:", "Block:", "Deep Work")
            if (/focus|block|deep|konzentration/i.test(title)) {
                return {
                    type: 'deep_work',
                    event,
                    hoursUntil: Math.round(hoursUntilEvent),
                    duration: durationHours,
                    confidence: 'medium',
                    protocolId: 'deep_work',
                    reason: `${Math.round(durationHours)}h Block erkannt: "${event.title}"`,
                    action: 'suggest',
                    priority: 'medium',
                    bioRequirements: []
                };
            }
        }
    }
    return null;
}

/**
 * Detect late-night events that might disrupt sleep
 * @param {Array} events - Calendar events
 * @param {Date} now - Current time
 * @returns {Object|null} Detection result
 */
function detectLateNightEvent(events, now = new Date()) {
    const today = now.toISOString().split('T')[0];

    for (const event of events) {
        const eventEnd = new Date(event.end);
        const eventDate = eventEnd.toISOString().split('T')[0];
        const endHour = eventEnd.getHours();

        // Check if event is today and ends after 20:00
        if (eventDate === today && endHour >= 20) {
            const title = (event.title || event.summary || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            const combinedText = `${title} ${description}`;

            // Check for late-night event keywords
            if (LATE_NIGHT_KEYWORDS.some(keyword => combinedText.includes(keyword))) {
                return {
                    type: 'late_night',
                    event,
                    endTime: `${endHour}:${eventEnd.getMinutes().toString().padStart(2, '0')}`,
                    confidence: 'high',
                    protocolId: 'sleep_guard',
                    reason: `Event endet um ${endHour}:${eventEnd.getMinutes().toString().padStart(2, '0')}: "${event.title}"`,
                    action: 'activate',
                    priority: 'high',
                    bioRequirements: ['melatonin', 'magnesium', 'blue_light_blockers']
                };
            }
        }
    }
    return null;
}

// ============================================
// MAIN PREDICTIVE ENGINE
// ============================================

/**
 * Scan calendar and detect contexts that require protocol activation
 * @param {Array} events - Calendar events
 * @param {Date} now - Current time
 * @returns {Array} Array of predictions
 */
export function scanCalendarForPredictions(events, now = new Date()) {
    if (!events || events.length === 0) {
        return [];
    }

    const predictions = [];

    // Run all detection functions
    const detections = [
        detectFlight(events, now),
        detectDeepWorkBlock(events, now),
        detectLateNightEvent(events, now)
    ].filter(Boolean);

    for (const detection of detections) {
        predictions.push({
            id: `pred_${detection.type}_${Date.now()}`,
            ...detection,
            timestamp: now.toISOString(),
            status: 'pending' // 'pending', 'activated', 'dismissed'
        });
    }

    logger.info('[PredictiveService] Scan complete:', {
        eventsScanned: events.length,
        predictionsFound: predictions.length,
        types: predictions.map(p => p.type)
    });

    return predictions;
}

/**
 * Auto-activate protocol based on prediction
 * @param {Object} prediction - Prediction object
 * @param {string} userId - User ID
 * @returns {Object} Activation result
 */
export async function autoActivateProtocol(prediction, userId) {
    try {
        // Find protocol pack
        const pack = PROTOCOL_PACKS.find(p => p.id === prediction.protocolId);
        if (!pack) {
            throw new Error(`Protocol not found: ${prediction.protocolId}`);
        }

        // Activate protocol via dataService
        const result = await activateProtocol(pack);

        logger.info('[PredictiveService] Auto-activated protocol:', {
            protocol: pack.title,
            reason: prediction.reason,
            userId
        });

        return {
            success: true,
            protocol: pack,
            prediction,
            message: generateBriefingMessage(prediction, pack)
        };
    } catch (error) {
        logger.error('[PredictiveService] Failed to auto-activate protocol:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate Family Office Briefing message
 * @param {Object} prediction - Prediction object
 * @param {Object} protocol - Protocol pack
 * @returns {string} Briefing message
 */
function generateBriefingMessage(prediction, protocol) {
    const messages = {
        flight: `Ich habe deinen Flug in ${prediction.hoursUntil}h erkannt. Das Jet-Lag-Protokoll startet jetzt mit Licht-Exposition-Timing und Melatonin-Shift.`,
        deep_work: `${prediction.duration}h Focus-Block erkannt. Dein Flow State Stack ist bereit: Phone Jail aktiviert, optimales Nootropika-Timing läuft.`,
        late_night: `Event endet spät (${prediction.endTime}). Sleep Guard aktiviert: Verstärkter Blaulicht-Filter + Melatonin-Boost für optimale Regeneration.`
    };

    return messages[prediction.type] || `Protokoll "${protocol.title}" wurde für dich aktiviert.`;
}

// ============================================
// BIO-FULFILLMENT BRIDGE
// ============================================

/**
 * Check if user has required supplements for protocol
 * (Vorbereitung auf Horizon 3 Commerce)
 *
 * @param {Array} requirements - Required supplements
 * @param {Object} inventory - User's supplement inventory
 * @returns {Object} Fulfillment check result
 */
export function checkBioFulfillment(requirements = [], inventory = {}) {
    if (requirements.length === 0) {
        return {
            fulfilled: true,
            missing: [],
            message: null
        };
    }

    const missing = requirements.filter(req => {
        const stock = inventory[req];
        return !stock || stock.quantity === 0 || stock.expires_soon;
    });

    if (missing.length > 0) {
        return {
            fulfilled: false,
            missing,
            message: `Du startest bald ein Protokoll. Hast du noch genug: ${missing.join(', ')}?`,
            action: 'restock',
            priority: 'medium'
        };
    }

    return {
        fulfilled: true,
        missing: [],
        message: null
    };
}

/**
 * Get user's supplement inventory
 * (Placeholder for Horizon 3 - currently returns mock data)
 *
 * @param {string} userId - User ID
 * @returns {Object} Supplement inventory
 */
export async function getSupplementInventory(userId) {
    // Placeholder: In Horizon 3, this will query actual inventory
    // For now, return mock data
    return {
        melatonin: { quantity: 30, unit: 'capsules', expires_soon: false },
        magnesium: { quantity: 20, unit: 'capsules', expires_soon: false },
        electrolytes: { quantity: 10, unit: 'servings', expires_soon: true },
        caffeine: { quantity: 0, unit: 'mg', expires_soon: false },
        'l-theanine': { quantity: 0, unit: 'mg', expires_soon: false },
        'alpha-gpc': { quantity: 0, unit: 'mg', expires_soon: false },
        'blue_light_blockers': { quantity: 1, unit: 'pair', expires_soon: false }
    };
}

/**
 * Generate complete predictive intelligence for dashboard
 * @param {Array} events - Calendar events
 * @param {string} userId - User ID
 * @returns {Object} Complete predictive data
 */
export async function getPredictiveIntelligence(events, userId) {
    try {
        // Scan calendar
        const predictions = scanCalendarForPredictions(events);

        if (predictions.length === 0) {
            return {
                hasPredictions: false,
                predictions: [],
                suggestions: []
            };
        }

        // Check bio-fulfillment for each prediction
        const inventory = await getSupplementInventory(userId);
        const enrichedPredictions = predictions.map(pred => {
            const fulfillment = checkBioFulfillment(pred.bioRequirements, inventory);
            return {
                ...pred,
                fulfillment
            };
        });

        // Sort by priority
        enrichedPredictions.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return {
            hasPredictions: true,
            predictions: enrichedPredictions,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('[PredictiveService] Failed to get predictive intelligence:', error);
        return {
            hasPredictions: false,
            predictions: [],
            error: error.message
        };
    }
}

// ============================================
// EXPORT ALL
// ============================================

export default {
    scanCalendarForPredictions,
    autoActivateProtocol,
    checkBioFulfillment,
    getSupplementInventory,
    getPredictiveIntelligence,
    detectFlight,
    detectDeepWorkBlock,
    detectLateNightEvent
};
