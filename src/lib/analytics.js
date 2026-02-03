/**
 * ExtensioVitae Analytics Service
 * 
 * Uses PostHog for privacy-friendly analytics
 * https://posthog.com
 * 
 * Event Types:
 * - Page views (automatic)
 * - User actions (custom events)
 * - Feature usage (custom events)
 * - Conversion tracking (custom events)
 */

// PostHog configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

// Check if analytics is enabled
const isEnabled = () => {
    return Boolean(POSTHOG_API_KEY) && import.meta.env.MODE === 'production';
};

// PostHog instance (lazy-loaded)
let posthog = null;

/**
 * Initialize PostHog analytics
 * Call this in your App.jsx or main.jsx
 */
export const initAnalytics = async () => {
    if (!isEnabled()) {
        console.log('[Analytics] Disabled (no API key or not in production)');
        return;
    }

    try {
        // Dynamic import PostHog
        const { default: posthogLib } = await import('posthog-js');

        posthogLib.init(POSTHOG_API_KEY, {
            api_host: POSTHOG_HOST,
            // Privacy settings
            autocapture: true,
            capture_pageview: true,
            capture_pageleave: true,
            disable_session_recording: false,
            // Performance
            loaded: (ph) => {
                console.log('[Analytics] PostHog initialized');
                posthog = ph;
            },
            // Respect Do Not Track
            respect_dnt: true,
            // Cookie settings
            persistence: 'localStorage+cookie',
            // Disable in dev
            opt_out_capturing_by_default: import.meta.env.MODE !== 'production',
        });

        posthog = posthogLib;
    } catch (error) {
        console.error('[Analytics] Failed to initialize:', error);
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
    if (!posthog) {
        // Log in development
        if (import.meta.env.MODE !== 'production') {
            console.log(`[Analytics] Event: ${eventName}`, properties);
        }
        return;
    }

    posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Track page view (called automatically, but can be called manually for SPAs)
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

/**
 * Track intake form completion
 */
export const trackIntakeCompleted = (intakeData) => {
    trackEvent('intake_completed', {
        age: intakeData.age,
        sex: intakeData.sex,
        primary_goal: intakeData.primary_goal,
        has_health_conditions: intakeData.chronic_conditions?.length > 0,
        time_budget: intakeData.daily_time_budget,
    });
};

/**
 * Track plan generation
 */
export const trackPlanGenerated = (planData) => {
    trackEvent('plan_generated', {
        longevity_score: planData.longevityScore,
        primary_pillars: planData.primary_focus_pillars,
        days_count: planData.days?.length,
        has_health_constraints: planData.health_metadata?.hasConstraints,
    });
};

/**
 * Track task completion
 */
export const trackTaskCompleted = (taskData) => {
    trackEvent('task_completed', {
        task_id: taskData.id,
        pillar: taskData.pillar,
        day: taskData.day,
    });
};

/**
 * Track day completion
 */
export const trackDayCompleted = (dayNumber, tasksCompleted, totalTasks) => {
    trackEvent('day_completed', {
        day: dayNumber,
        tasks_completed: tasksCompleted,
        total_tasks: totalTasks,
        completion_rate: (tasksCompleted / totalTasks * 100).toFixed(1),
    });
};

/**
 * Track feedback submission
 */
export const trackFeedbackSubmitted = (feedbackType, rating) => {
    trackEvent('feedback_submitted', {
        type: feedbackType,
        rating: rating,
    });
};

/**
 * Track user signup
 */
export const trackSignup = (method = 'email') => {
    trackEvent('user_signed_up', {
        method: method,
    });
};

/**
 * Track user login
 */
export const trackLogin = (method = 'email') => {
    trackEvent('user_logged_in', {
        method: method,
    });
};

/**
 * Track plan review modal opened
 */
export const trackPlanReviewOpened = () => {
    trackEvent('plan_review_opened');
};

/**
 * Track plan accepted
 */
export const trackPlanAccepted = () => {
    trackEvent('plan_accepted');
};

/**
 * Track health profile updated
 */
export const trackHealthProfileUpdated = (hasConditions, hasInjuries) => {
    trackEvent('health_profile_updated', {
        has_conditions: hasConditions,
        has_injuries: hasInjuries,
    });
};

/**
 * Track feature usage
 */
export const trackFeatureUsed = (featureName) => {
    trackEvent('feature_used', {
        feature: featureName,
    });
};

// ============================================
// Export default for easy import
// ============================================

export default {
    init: initAnalytics,
    identify: identifyUser,
    track: trackEvent,
    pageView: trackPageView,
    reset: resetUser,
    // Pre-defined events
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
