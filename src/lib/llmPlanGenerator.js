/**
 * LLM Plan Generator
 * 
 * Supports OpenAI and Claude for AI-powered plan generation.
 * Falls back to deterministic algorithm if no credentials are configured.
 */

import { logger } from './logger.js';
import { supabase } from './supabase.js';

/**
 * Generate a plan using the Supabase Edge Function proxy
 * This keeps API keys secure on the backend.
 */
export async function generatePlanWithLLM(intakeData) {
    logger.info(`[LLM] Requesting plan generation via Supabase Edge Function...`);

    const { data, error } = await supabase.functions.invoke('generate-plan-proxy', {
        body: {
            intakeData,
            provider: 'openai'
        }
    });

    if (error) {
        logger.error('[LLM] Edge Function Error:', error);
        throw new Error(`Plan generation failed: ${error.message}`);
    }

    if (data?.error) {
        logger.error('[LLM] Provider Error:', data.error);
        throw new Error(`AI Provider Error: ${data.error}`);
    }

    logger.info(`[LLM] Plan generated successfully via Proxy`);
    return enrichPlan(data, intakeData);
}

/**
 * Enrich the LLM-generated plan with metadata
 */
function enrichPlan(plan, intakeData) {
    const now = new Date();

    return {
        ...plan,
        generated_at: now.toISOString(),
        start_date: now.toISOString().split('T')[0],
        generation_method: 'llm-proxy',
        meta: {
            input: intakeData,
            generated_at: now.toISOString()
        }
    };
}

/**
 * Check if LLM generation is available
 * Always true now, as keys are managed on backend
 */
export function isLLMAvailable() {
    return true;
}

/**
 * Get the configured LLM provider name
 */
export function getLLMProvider() {
    return 'proxied-openai'; // Default via Edge Function
}

export const SYSTEM_PROMPT = 'Managed in Edge Function';
