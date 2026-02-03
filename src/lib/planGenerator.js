/**
 * EXTENSIOVITAE — Unified Plan Generator
 * ----------------------------------------
 * Automatically uses LLM (OpenAI/Claude) if credentials are configured,
 * otherwise falls back to deterministic algorithm.
 */

import { build30DayBlueprint, TASKS_EXAMPLE } from './planBuilder.js';
import { isLLMAvailable, generatePlanWithLLM, getLLMProvider } from './llmPlanGenerator.js';
import { logger } from './logger.js';

/**
 * Generate a 30-day longevity plan
 * 
 * @param {Object} intakeData - User's intake form data
 * @param {Object} options - Generation options
 * @param {boolean} options.forceLLM - If true, only use LLM (fail if not available)
 * @param {boolean} options.forceAlgorithm - If true, only use algorithm
 * @returns {Promise<Object>} Generated plan
 */
export async function generatePlan(intakeData, options = {}) {
    const { forceLLM = false, forceAlgorithm = false } = options;

    // Force algorithm mode
    if (forceAlgorithm) {
        logger.info('[PlanGenerator] Using deterministic algorithm (forced)');
        return generateWithAlgorithm(intakeData, options);
    }

    // Force LLM mode
    if (forceLLM) {
        if (!isLLMAvailable()) {
            throw new Error('LLM generation requested but no API keys configured');
        }
        logger.info('[PlanGenerator] Using LLM (forced)');
        return await generateWithLLMWithFallback(intakeData, false, options);
    }

    // Auto mode: try LLM first, fallback to algorithm
    if (isLLMAvailable()) {
        logger.info(`[PlanGenerator] LLM available (${getLLMProvider()}), attempting LLM generation...`);
        return await generateWithLLMWithFallback(intakeData, true, options);
    } else {
        logger.info('[PlanGenerator] No LLM configured, using deterministic algorithm');
        return generateWithAlgorithm(intakeData, options);
    }
}

/**
 * Generate plan with LLM, optionally falling back to algorithm on error
 */
async function generateWithLLMWithFallback(intakeData, allowFallback, options = {}) {
    try {
        const plan = await generatePlanWithLLM(intakeData);

        // Validate the LLM response has required structure
        if (!plan.days || !Array.isArray(plan.days) || plan.days.length !== 30) {
            throw new Error('LLM generated invalid plan structure (missing or incorrect days array)');
        }

        // Add generation method marker
        plan.generation_method = 'llm';
        plan.llm_provider = getLLMProvider();

        return plan;
    } catch (error) {
        logger.error('[PlanGenerator] LLM generation failed:', error.message);

        if (allowFallback) {
            logger.info('[PlanGenerator] Falling back to deterministic algorithm...');
            const plan = generateWithAlgorithm(intakeData, options);
            plan.llm_error = error.message;
            return plan;
        }

        throw error;
    }
}

/**
 * Generate plan using deterministic algorithm
 */
function generateWithAlgorithm(intakeData, options = {}) {
    const { healthProfile } = options;
    const result = build30DayBlueprint(intakeData, TASKS_EXAMPLE, {}, healthProfile);
    const plan = result.json;

    // Normalize structure to match LLM output format
    plan.generation_method = 'algorithm';

    // Map pillars for UI compatibility (sleep_recovery -> sleep, etc.)
    plan.primary_focus_pillars = Object.entries(plan.meta.computed.needs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k.split('_')[0]);

    return plan;
}

/**
 * Get information about the current plan generation configuration
 */
export function getPlanGeneratorInfo() {
    return {
        llmAvailable: isLLMAvailable(),
        llmProvider: getLLMProvider(),
        defaultMode: isLLMAvailable() ? 'llm' : 'algorithm'
    };
}

export { isLLMAvailable, getLLMProvider };
