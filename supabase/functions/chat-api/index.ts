import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
    user_id: string;
    message: string;
}

interface Intent {
    type: 'state_update' | 'question' | 'feedback' | 'command';
    confidence: number;
}

interface StateUpdate {
    field: string | null;
    value: any;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { user_id, message }: ChatRequest = await req.json();

        if (!user_id || !message) {
            throw new Error('user_id and message are required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get conversation history
        const { data: history } = await supabase
            .from('conversation_history')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(5);

        const conversationHistory = history?.reverse() || [];

        // 2. Classify intent
        const intent = await classifyIntent(message, anthropicKey);

        // 3. Route based on intent
        let responseContext: any = {};

        if (intent.type === 'state_update') {
            const stateUpdate = await parseStateUpdate(message, anthropicKey);

            if (stateUpdate.field && stateUpdate.value !== null) {
                try {
                    const stateApiResponse = await fetch(`${supabaseUrl}/functions/v1/state-api`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'update_field',
                            user_id: user_id,
                            field: stateUpdate.field,
                            new_value: stateUpdate.value,
                            source: 'chat',
                            context: { message }
                        })
                    });

                    if (stateApiResponse.ok) {
                        responseContext.stateUpdate = stateUpdate;
                    }
                } catch (error) {
                    console.error('Error updating user state:', error);
                }
            }
        }

        if (intent.type === 'question' || intent.type === 'state_update') {
            const { data: userState } = await supabase
                .from('user_states')
                .select('*')
                .eq('user_id', user_id)
                .single();

            try {
                const canonResponse = await fetch(`${supabaseUrl}/functions/v1/canon-api`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'semantic_search',
                        query: message,
                        top_k: 3
                    })
                });

                if (canonResponse.ok) {
                    const canonData = await canonResponse.json();
                    responseContext.canonEntries = canonData.data || [];
                }
            } catch (error) {
                console.error('Error retrieving canon entries:', error);
                responseContext.canonEntries = [];
            }

            responseContext.userState = userState;
        }

        const response = await generateResponse(
            message,
            conversationHistory,
            responseContext,
            anthropicKey
        );

        await supabase.from('conversation_history').insert({
            user_id: user_id,
            role: 'assistant',
            message: response,
            intent: intent.type,
            state_updates: responseContext.stateUpdate || {},
            canon_entries_used: responseContext.canonEntries?.map((e: any) => e.id) || []
        });

        return new Response(
            JSON.stringify({ success: true, response }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function classifyIntent(message: string, anthropicKey: string): Promise<Intent> {
    const prompt = `Classify the following user message into one of these intents:
- state_update: User is reporting a state change (e.g., "I slept 6 hours", "Stress level 8/10", "Ich habe 6h geschlafen")
- question: User is asking a question (e.g., "Should I train today?", "What should I eat?", "Soll ich heute trainieren?")
- feedback: User is giving feedback (e.g., "That helped", "This didn't work", "Das hat mir geholfen")
- command: User is issuing a command (e.g., "/stats", "/history")

User message: "${message}"

Respond with JSON only: {"type": "state_update|question|feedback|command", "confidence": 0.0-1.0}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error (classifyIntent):', response.status, errorText);
            return { type: 'question', confidence: 0.5 };
        }

        const data = await response.json();
        console.log('Anthropic response (classifyIntent):', JSON.stringify(data));

        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('Invalid Anthropic response format:', data);
            return { type: 'question', confidence: 0.5 };
        }

        const content = data.content[0].text;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('Intent classification error:', error);
        return { type: 'question', confidence: 0.5 };
    }
}

async function parseStateUpdate(message: string, anthropicKey: string): Promise<StateUpdate> {
    const prompt = `Extract state updates from the following user message.
Map to these fields (use the exact field names):
- sleep_hours: number (e.g., "6h geschlafen" → 6, "slept 7 hours" → 7)
- stress_1_10: number 1-10 (e.g., "Stress 8/10" → 8, "stress level 5" → 5)
- training_frequency: string (e.g., "3x trainiert" → "3-4", "train 5 times" → "5+")
- recovery_state: string (e.g., "fühle mich müde" → "fatigued", "feel great" → "optimal")

User message: "${message}"

Respond with JSON only: {"field": "sleep_hours|stress_1_10|training_frequency|recovery_state", "value": <value>}
If no state update found, respond with: {"field": null, "value": null}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error (parseStateUpdate):', response.status, errorText);
            return { field: null, value: null };
        }

        const data = await response.json();
        console.log('Anthropic response (parseStateUpdate):', JSON.stringify(data));

        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('Invalid Anthropic response format:', data);
            return { field: null, value: null };
        }

        const content = data.content[0].text;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('State update parsing error:', error);
        return { field: null, value: null };
    }
}

async function generateResponse(
    userMessage: string,
    conversationHistory: any[],
    context: any,
    anthropicKey: string
): Promise<string> {
    const systemPrompt = `Du bist ein empathischer Longevity Coach für ExtensioVitae. Deine Aufgabe ist es, dem User zu helfen, seine Gesundheit und Langlebigkeit zu optimieren.

**Kontext:**
- User State: ${JSON.stringify(context.userState || {}, null, 2)}
- Relevante Canon Entries: ${JSON.stringify(context.canonEntries?.map((e: any) => ({ domain: e.domain, doctrine: e.doctrine, mechanism: e.mechanism })) || [], null, 2)}
- State Update: ${JSON.stringify(context.stateUpdate || {}, null, 2)}

**Antwort-Richtlinien:**
1. **Sei empathisch und ermutigend** - Keine Schuldzuweisungen, nur Unterstützung
2. **Gib konkrete, umsetzbare Empfehlungen** - Keine vagen Ratschläge
3. **Beziehe dich auf wissenschaftliche Evidenz** - Nutze Canon Entries wenn relevant
4. **Halte Antworten kurz und prägnant** - Max 3-4 Sätze, außer bei komplexen Fragen
5. **Verwende Markdown für Formatierung** - **bold**, - Listen, etc.
6. **Sprich Deutsch** - Natürlich und freundlich`;

    const messages = [
        ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.message
        })),
        {
            role: 'user',
            content: userMessage
        }
    ];

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 500,
                system: systemPrompt,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error (generateResponse):', response.status, errorText);
            return 'Entschuldigung, ich hatte einen Fehler beim Generieren der Antwort. Bitte versuche es nochmal.';
        }

        const data = await response.json();
        console.log('Anthropic response (generateResponse):', JSON.stringify(data));

        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('Invalid Anthropic response format:', data);
            return 'Entschuldigung, ich hatte einen Fehler beim Generieren der Antwort. Bitte versuche es nochmal.';
        }

        return data.content[0].text;
    } catch (error) {
        console.error('Response generation error:', error);
        return 'Entschuldigung, ich hatte einen Fehler beim Generieren der Antwort. Bitte versuche es nochmal.';
    }
}