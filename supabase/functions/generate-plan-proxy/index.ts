import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            intakeData,
            provider = 'openai',
            calendarEvents = [],
            emergencyMode = null,
            healthProfile = null
        } = await req.json()

        // Authorization check
        // In production, you might want to verify the Supabase JWT user here

        // ============================================================================
        // BLOCK E: Build Enhanced AI Context (v0.9.0)
        // ============================================================================

        const buildEnhancedContext = () => {
            let contextSections = [];

            // 1. Base Intake Data
            contextSections.push(`**User Intake Data:**\n${JSON.stringify(intakeData, null, 2)}`);

            // 2. Calendar Events Context
            if (calendarEvents && calendarEvents.length > 0) {
                const upcomingEvents = calendarEvents
                    .filter(event => new Date(event.start) > new Date())
                    .slice(0, 10); // Next 10 events

                if (upcomingEvents.length > 0) {
                    contextSections.push(
                        `\n**Upcoming Calendar Context (Next 7 Days):**\n` +
                        upcomingEvents.map(event =>
                            `- ${event.title} (${new Date(event.start).toLocaleDateString('de-DE')}, ${event.allDay ? 'Ganztägig' : new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`
                        ).join('\n') +
                        `\n\n**Instructions:** Consider these calendar commitments when scheduling tasks. Avoid conflicts with meetings/events. Suggest pre-event protocols (e.g., stress management before important meetings, sleep optimization before travel).`
                    );
                }
            }

            // 3. Emergency Mode Context
            if (emergencyMode && emergencyMode !== 'normal') {
                const modeDescriptions = {
                    'crisis': '🚨 CRISIS MODE: User is in acute stress/overwhelm. Prioritize immediate stress relief, minimal viable routines, and emergency interventions.',
                    'recovery': '🔋 RECOVERY MODE: User needs rest and restoration. Focus on gentle recovery protocols, reduced load, and healing.',
                    'performance': '⚡ PERFORMANCE MODE: User has critical deadline/event. Optimize for peak cognitive performance and energy.',
                    'travel': '✈️ TRAVEL MODE: User is traveling or jet-lagged. Focus on circadian adaptation, hydration, and portable protocols.'
                };

                contextSections.push(
                    `\n**Current Emergency Mode:** ${modeDescriptions[emergencyMode] || emergencyMode}\n` +
                    `**Instructions:** Adapt ALL recommendations to fit this mode. Modify task difficulty, duration, and timing accordingly. This takes PRIORITY over default recommendations.`
                );
            }

            // 4. Health Profile Context
            if (healthProfile) {
                let healthSummary = '\n**Health Profile Summary:**\n';

                if (healthProfile.chronic_conditions && healthProfile.chronic_conditions.length > 0) {
                    healthSummary += `- Chronic Conditions: ${healthProfile.chronic_conditions.join(', ')}\n`;
                }
                if (healthProfile.medications && healthProfile.medications.length > 0) {
                    healthSummary += `- Current Medications: ${healthProfile.medications.join(', ')}\n`;
                }
                if (healthProfile.allergies && healthProfile.allergies.length > 0) {
                    healthSummary += `- Allergies/Intolerances: ${healthProfile.allergies.join(', ')}\n`;
                }
                if (healthProfile.fitness_level) {
                    healthSummary += `- Fitness Level: ${healthProfile.fitness_level}\n`;
                }
                if (healthProfile.sleep_quality) {
                    healthSummary += `- Sleep Quality: ${healthProfile.sleep_quality}/10\n`;
                }
                if (healthProfile.stress_level) {
                    healthSummary += `- Stress Level: ${healthProfile.stress_level}/10\n`;
                }

                healthSummary += `\n**CRITICAL SAFETY INSTRUCTIONS:**\n` +
                    `- NEVER contradict medical advice or prescriptions\n` +
                    `- Flag any medication interactions with supplements\n` +
                    `- Respect physical limitations based on fitness level\n` +
                    `- Avoid allergens in nutrition recommendations\n` +
                    `- For chronic conditions: suggest supportive lifestyle changes only, defer to medical professionals`;

                contextSections.push(healthSummary);
            }

            // 5. Circadian & Timing Context
            const wakeTime = intakeData.wake_time || '07:00';
            contextSections.push(
                `\n**Circadian Context:**\n` +
                `- Wake Time: ${wakeTime}\n` +
                `- Morning Light Window: 30-90 min after wake (${wakeTime})\n` +
                `- Deep Work Window: 2-5 hours after wake\n` +
                `- Blue Light Cutoff: 2.5 hours before bedtime (assume 16h wake cycle)\n\n` +
                `**Instructions:** Schedule cognitively demanding tasks during peak circadian windows. Suggest morning light exposure. Implement melatonin-protective measures for evening.`
            );

            return contextSections.join('\n\n');
        };

        const enhancedContext = buildEnhancedContext();

        // 1. OpenAI Implementation (Enhanced Context)
        if (provider === 'openai') {
            const apiKey = Deno.env.get('OPENAI_API_KEY')
            if (!apiKey) throw new Error('OpenAI API key not configured')

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: `You are ExtensioVitae, an intelligent longevity lifestyle optimization assistant with context awareness.

**Core Principles:**
- Respond with valid JSON only
- NEVER make medical claims or diagnose conditions
- Respect user's calendar, health profile, and current mode
- Adapt recommendations to real-world context
- Prioritize safety and evidence-based practices
- Respond in German language

**Enhanced Context Awareness (v0.9.0):**
You now receive rich context including calendar events, emergency mode, health profile, and circadian timing. Use this to create truly personalized, context-aware plans that adapt to the user's real life.`
                        },
                        {
                            role: 'user',
                            content: `Generate a personalized 30-day longevity plan with full context awareness:\n\n${enhancedContext}\n\n**Output Format:** Valid JSON with standard plan structure (days array, etc.). Respond in German.`
                        }
                    ],
                    response_format: { type: 'json_object' }
                }),
            })

            const data = await response.json()
            if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`)

            return new Response(JSON.stringify(JSON.parse(data.choices[0].message.content)), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Claude Implementation (Enhanced Context)
        if (provider === 'claude') {
            const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
            if (!apiKey) throw new Error('Anthropic API key not configured')

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 4096,
                    system: `You are ExtensioVitae, an intelligent longevity lifestyle optimization assistant with context awareness.

**Core Principles:**
- Generate valid JSON plans only
- NEVER make medical claims or diagnose conditions
- Respect user's calendar, health profile, and current emergency mode
- Adapt recommendations to real-world context (travel, stress, recovery, performance)
- Prioritize safety and evidence-based practices
- Respond in German language

**Enhanced Context Awareness (v0.9.0):**
You receive rich context: calendar events, emergency mode, health profile, and circadian timing. Create truly personalized, context-aware plans that adapt to the user's real life. Consider scheduling conflicts, health constraints, and current mode when generating recommendations.`,
                    messages: [
                        {
                            role: 'user',
                            content: `Generate a personalized 30-day longevity plan with full context awareness:\n\n${enhancedContext}\n\n**Output:** Valid JSON with standard plan structure (days array with tasks, etc.). Antworte auf Deutsch.`
                        }
                    ]
                }),
            })

            const data = await response.json()
            if (data.error) throw new Error(`Claude Error: ${data.error.message}`)

            return new Response(JSON.stringify({ plan: data.content[0].text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(`Unknown provider: ${provider}`)

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
