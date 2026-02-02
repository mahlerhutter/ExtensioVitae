/**
 * LLM Plan Generator
 * 
 * Supports OpenAI and Claude for AI-powered plan generation.
 * Falls back to deterministic algorithm if no credentials are configured.
 */

// System prompt for LLM plan generation
const SYSTEM_PROMPT = `You are ExtensioVitae, a longevity lifestyle optimization assistant. Create personalized 30-day plans for high-performing professionals.

## CRITICAL CONSTRAINTS
- NEVER make medical claims or diagnoses
- NEVER recommend supplements, medications, or treatments
- Maximum of the user's specified daily time budget for all tasks combined
- Be specific and actionable, not vague
- Respond in German language

## THE 6 PILLARS
1. SLEEP_RECOVERY - Sleep hygiene, timing, environment, regeneration
2. CIRCADIAN_RHYTHM - Light exposure, caffeine timing, meal rhythm
3. MENTAL_RESILIENCE - Breathwork, meditation, stress management
4. NUTRITION_METABOLISM - Protein timing, blood sugar control, meal quality
5. MOVEMENT_MUSCLE - Strength training, NEAT, Zone-2 cardio, steps
6. SUPPLEMENTS - Targeted supplementation (use sparingly)

## PLAN PHASES
- Days 1-7: STABILIZE (Foundation building)
- Days 8-14: BUILD (Increasing intensity)
- Days 15-21: OPTIMIZE (Fine-tuning)
- Days 22-30: CONSOLIDATE (Habit integration)

## OUTPUT FORMAT
Return a valid JSON object matching this structure:
{
  "user_name": "string",
  "plan_summary": "2-3 sentence German summary",
  "primary_focus_pillars": ["pillar1", "pillar2", "pillar3"],
  "days": [
    {
      "day": 1,
      "phase": "stabilize|build|optimize|consolidate",
      "total_time": number,
      "tasks": [
        {
          "id": "d1_t0_pillar_name",
          "pillar": "sleep_recovery|circadian_rhythm|mental_resilience|nutrition_metabolism|movement_muscle|supplements",
          "summary": "Specific German task instruction",
          "duration": number
        }
      ]
    }
  ]
}

## PERSONALIZATION
Weight the plan based on:
- primary_goal: Heavily prioritize this outcome
- sleep_hours_bucket: If <7, prioritize sleep
- stress_1_10: If >7, prioritize mental resilience
- training_frequency: Adapt movement tasks
- diet_pattern: Address specific flags
- daily_time_budget: STRICTLY respect this limit
- equipment_access: No gym exercises if "none"`;

/**
 * Generate a plan using OpenAI GPT-4
 */
async function generateWithOpenAI(intakeData, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Generate a personalized 30-day longevity plan for this user:\n\n${JSON.stringify(intakeData, null, 2)}\n\nRespond with valid JSON only.`
                }
            ],
            temperature: 0.7,
            max_tokens: 12000,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

/**
 * Generate a plan using Anthropic Claude
 */
async function generateWithClaude(intakeData, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 12000,
            messages: [
                {
                    role: 'user',
                    content: `${SYSTEM_PROMPT}\n\n---\n\nGenerate a personalized 30-day longevity plan for this user:\n\n${JSON.stringify(intakeData, null, 2)}\n\nRespond with valid JSON only, no markdown code blocks.`
                }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content;
    if (content.includes('```json')) {
        jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
        jsonStr = content.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonStr.trim());
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
        generation_method: 'llm',
        meta: {
            input: intakeData,
            generated_at: now.toISOString()
        }
    };
}

/**
 * Get configured LLM provider and API key
 */
function getLLMConfig() {
    // Check for environment variables (Vite style)
    const openaiKey = import.meta.env?.VITE_OPENAI_API_KEY;
    const claudeKey = import.meta.env?.VITE_ANTHROPIC_API_KEY;
    const preferredProvider = import.meta.env?.VITE_LLM_PROVIDER || 'auto';

    // Priority: preferred provider -> OpenAI -> Claude -> null
    if (preferredProvider === 'openai' && openaiKey) {
        return { provider: 'openai', apiKey: openaiKey };
    }
    if (preferredProvider === 'claude' && claudeKey) {
        return { provider: 'claude', apiKey: claudeKey };
    }
    if (preferredProvider === 'auto') {
        if (openaiKey) return { provider: 'openai', apiKey: openaiKey };
        if (claudeKey) return { provider: 'claude', apiKey: claudeKey };
    }

    return null;
}

/**
 * Check if LLM generation is available
 */
export function isLLMAvailable() {
    return getLLMConfig() !== null;
}

/**
 * Get the configured LLM provider name
 */
export function getLLMProvider() {
    const config = getLLMConfig();
    return config?.provider || 'none';
}

/**
 * Generate a plan using LLM (OpenAI or Claude)
 * Throws an error if no LLM is configured
 */
export async function generatePlanWithLLM(intakeData) {
    const config = getLLMConfig();

    if (!config) {
        throw new Error('No LLM API key configured. Set VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY.');
    }

    console.log(`[LLM] Generating plan with ${config.provider}...`);

    let plan;
    if (config.provider === 'openai') {
        plan = await generateWithOpenAI(intakeData, config.apiKey);
    } else if (config.provider === 'claude') {
        plan = await generateWithClaude(intakeData, config.apiKey);
    } else {
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }

    console.log(`[LLM] Plan generated successfully with ${config.provider}`);
    return enrichPlan(plan, intakeData);
}

export { SYSTEM_PROMPT };
