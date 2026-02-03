/**
 * ExtensioVitae Analytics Service
 * 
 * Uses PostHog for privacy-friendly analytics
 * https://posthog.com
 * 
 * GRACEFUL DEGRADATION:
 * - If posthog-js is not installed, events are logged to console in dev mode
 * - If no API key is configured, analytics is disabled
 * - Works without any dependencies installed
 * 
 * Event Types:
 * - Page views (automatic)
 * - User actions (custom events)
 * - Feature usage (custom events)
 * - Conversion tracking (custom events)
 */

import { logger } from './logger';

// PostHog configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

// Check if analytics is enabled (needs API key AND production mode)
const isEnabled = () => {
    return Boolean(POSTHOG_API_KEY) && import.meta.env.MODE === 'production';
};

// PostHog instance (lazy-loaded, may be null if not installed)
let posthog = null;
let initAttempted = false;

/**
 * Try to load PostHog dynamically
 * Uses a try-catch approach that works with Vite's bundler
 */
const tryLoadPosthog = async () => {
    try {
        // Check if posthog-js is available in node_modules
        // This uses a string variable to prevent Vite from analyzing the import
        const moduleName = 'posthog-js';
        const module = await import(/* @vite-ignore */ moduleName);
        return module.default;
    } catch (e) {
        return null;
    }
};

/**
 * Initialize PostHog analytics
 * Call this in your App.jsx or main.jsx
 * Gracefully handles cases where posthog-js is not installed
 */
export const initAnalytics = async () => {
    if (initAttempted) return;
    initAttempted = true;

    // In development without API key, just log
    if (!POSTHOG_API_KEY) {
        logger.info('[Analytics] No API key configured - events will be logged to console');
        return;
    }

    // Only fully enable in production
    if (!isEnabled()) {
        logger.info('[Analytics] Development mode - events logged to console');
        return;
    }

    try {
        const posthogLib = await tryLoadPosthog();

        if (!posthogLib) {
            logger.warn('[Analytics] posthog-js not installed. Install with: npm install posthog-js');
            return;
        }

        posthogLib.init(POSTHOG_API_KEY, {
            api_host: POSTHOG_HOST,
            autocapture: true,
            capture_pageview: true,
            capture_pageleave: true,
            disable_session_recording: false,
            loaded: (ph) => {
                logger.info('[Analytics] PostHog initialized');
                posthog = ph;
            },
            respect_dnt: true,
            persistence: 'localStorage+cookie',
            opt_out_capturing_by_default: false,
        });

        posthog = posthogLib;
    } catch (error) {
        logger.warn('[Analytics] PostHog not available');
    }
};

/**
 * Identify a user (call after login)
 */
export const identifyUser = (userId, properties = {}) => {
    if (!posthog) return;

    posthog.identify(userId, {
        ...properties,
        $set: {
            ...properties,
            last_seen: new Date().toISOString(),
        },
    });
};

/**
 * Track a custom event
 */
export const trackEvent = (eventName, properties = {}) => {
    // Always log in development for debugging
    if (import.meta.env.MODE !== 'production') {
        logger.debug(`[Analytics] ${eventName}`, properties);
    }

    if (!posthog) return;

    posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Track page view
 */
export const trackPageView = (pageName) => {
    if (!posthog) return;
    posthog.capture('$pageview', { page: pageName });
};

/**
 * Reset user (call on logout)
 */
export const resetUser = () => {
    if (!posthog) return;
    posthog.reset();
};

// ============================================
// Pre-defined Event Helpers
// ============================================

export const trackIntakeCompleted = (intakeData) => {
    trackEvent('intake_completed', {
        age: intakeData.age,
        sex: intakeData.sex,
        primary_goal: intakeData.primary_goal,
        has_health_conditions: intakeData.chronic_conditions?.length > 0,
        time_budget: intakeData.daily_time_budget,
    });
};

export const trackPlanGenerated = (planData) => {
    trackEvent('plan_generated', {
        longevity_score: planData.longevityScore,
        primary_pillars: planData.primary_focus_pillars,
        days_count: planData.days?.length,
        has_health_constraints: planData.health_metadata?.hasConstraints,
    });
};

export const trackTaskCompleted = (taskData) => {
    trackEvent('task_completed', {
        task_id: taskData.id,
        pillar: taskData.pillar,
        day: taskData.day,
    });
};

export const trackDayCompleted = (dayNumber, tasksCompleted, totalTasks) => {
    trackEvent('day_completed', {
        day: dayNumber,
        tasks_completed: tasksCompleted,
        total_tasks: totalTasks,
        completion_rate: (tasksCompleted / totalTasks * 100).toFixed(1),
    });
};

export const trackFeedbackSubmitted = (feedbackType, rating) => {
    trackEvent('feedback_submitted', {
        type: feedbackType,
        rating: rating,
    });
};

export const trackSignup = (method = 'email') => {
    trackEvent('user_signed_up', { method });
};

export const trackLogin = (method = 'email') => {
    trackEvent('user_logged_in', { method });
};

export const trackPlanReviewOpened = () => {
    trackEvent('plan_review_opened');
};

export const trackPlanAccepted = () => {
    trackEvent('plan_accepted');
};

export const trackHealthProfileUpdated = (hasConditions, hasInjuries) => {
    trackEvent('health_profile_updated', {
        has_conditions: hasConditions,
        has_injuries: hasInjuries,
    });
};

export const trackFeatureUsed = (featureName) => {
    trackEvent('feature_used', { feature: featureName });
};

// ============================================
// Export default
// ============================================

export default {
    init: initAnalytics,
    identify: identifyUser,
    track: trackEvent,
    pageView: trackPageView,
    reset: resetUser,
    events: {
        intakeCompleted: trackIntakeCompleted,
        planGenerated: trackPlanGenerated,
        taskCompleted: trackTaskCompleted,
        dayCompleted: trackDayCompleted,
        feedbackSubmitted: trackFeedbackSubmitted,
        signup: trackSignup,
        login: trackLogin,
        planReviewOpened: trackPlanReviewOpened,
        planAccepted: trackPlanAccepted,
        healthProfileUpdated: trackHealthProfileUpdated,
        featureUsed: trackFeatureUsed,
    },
};
