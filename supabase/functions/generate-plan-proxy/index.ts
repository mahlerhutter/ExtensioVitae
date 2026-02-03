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
        const { intakeData, provider = 'openai' } = await req.json()

        // Authorization check
        // In production, you might want to verify the Supabase JWT user here

        // 1. OpenAI Implementation
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
                    model: 'gpt-4-turbo-preview', // Force consistent model
                    messages: [
                        {
                            role: 'system',
                            content: `You are ExtensioVitae, a longevity lifestyle optimization assistant. 
              Respond with valid JSON only. 
              NEVER make medical claims.
              Respond in German language.`
                        },
                        {
                            role: 'user',
                            content: `Generate a personalized 30-day longevity plan for this user:\n\n${JSON.stringify(intakeData)}\n\nRespond with valid JSON.`
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

        // 2. Claude Implementation
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
                    messages: [
                        {
                            role: 'user',
                            content: `You are ExtensioVitae. Generate a personalized 30-day longevity plan (German, JSON-only) for:\n\n${JSON.stringify(intakeData)}`
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
