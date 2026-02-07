import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Du bist ein Longevity-Tracking-Assistent für ExtensioVitae. 
Deine Aufgabe: Klassifiziere Freitext-Eingaben des Users in strukturierte Aktivitäts-Logs.

PILLARS (die 6 Säulen der Langlebigkeit):
- sleep: Schlaf, Erholung, Licht-Exposition, Nickerchen, Schlafhygiene
- movement: Sport, Bewegung, Training, Wandern, Joggen, Krafttraining, Dehnen, Yoga (physisch)
- nutrition: Essen, Trinken, Kochen, Supplements, Fasten, Mahlzeiten
- stress: Meditation, Breathwork, Entspannung, Journaling, Natur-Exposure (mental)
- connection: Soziale Kontakte, Familie, Freunde, Community, Gespräche, Teamarbeit
- environment: Umgebung, Sauna, Kälteexposition, Luftqualität, Toxin-Vermeidung, Sonnenlicht

REGELN:
1. Antworte IMMER als valides JSON
2. Erkenne die Dauer wenn angegeben (z.B. "1h joggen" → 60 min)
3. Wenn keine Dauer angegeben, schätze realistisch
4. Erkenne Intensität aus Kontext (z.B. "Sprint" = high, "Spaziergang" = low)
5. Manche Aktivitäten zahlen auf ZWEI Säulen ein (z.B. "Wandern mit Freunden" = movement + connection)
6. display_text soll kurz und klar sein (max 40 Zeichen)
7. Antworte auf Deutsch

JSON FORMAT:
{
  "pillar": "movement",
  "secondary_pillar": null,
  "activity": "Joggen",
  "duration_minutes": 60,
  "intensity": "medium",
  "context": "outdoor",
  "display_emoji": "🏃",
  "display_text": "Joggen im Park · 60min",
  "longevity_score_impact": 8,
  "confidence": 0.95
}`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { raw_input } = await req.json()

        if (!raw_input || typeof raw_input !== 'string' || raw_input.trim().length === 0) {
            throw new Error('Eingabe darf nicht leer sein')
        }

        if (raw_input.length > 500) {
            throw new Error('Eingabe zu lang (max 500 Zeichen)')
        }

        // Get user from JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Nicht autorisiert')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Nicht autorisiert')

        // Call OpenAI
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) throw new Error('OpenAI API Key nicht konfiguriert')

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Klassifiziere: "${raw_input.trim()}"` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 300
            }),
        })

        const openaiData = await openaiResponse.json()
        if (openaiData.error) throw new Error(`OpenAI: ${openaiData.error.message}`)

        const classification = JSON.parse(openaiData.choices[0].message.content)

        // Validate required fields
        const validPillars = ['sleep', 'movement', 'nutrition', 'stress', 'connection', 'environment']
        if (!validPillars.includes(classification.pillar)) {
            classification.pillar = 'movement' // Fallback
        }
        if (classification.secondary_pillar && !validPillars.includes(classification.secondary_pillar)) {
            classification.secondary_pillar = null
        }

        // Clamp and validate values
        const validIntensities = ['low', 'medium', 'high']
        const validContexts = ['indoor', 'outdoor', 'social', 'digital']
        const rawImpact = Number(classification.longevity_score_impact) || 5
        const clampedImpact = Math.max(1, Math.min(10, rawImpact))
        const rawConfidence = Number(classification.confidence) || 0.8
        const clampedConfidence = Math.max(0, Math.min(1, rawConfidence))

        // Save to database
        const { data: logEntry, error: insertError } = await supabaseClient
            .from('activity_logs')
            .insert({
                user_id: user.id,
                raw_input: raw_input.trim(),
                pillar: classification.pillar,
                secondary_pillar: classification.secondary_pillar || null,
                activity: classification.activity || raw_input.trim(),
                duration_minutes: classification.duration_minutes ? Math.max(0, Number(classification.duration_minutes)) : null,
                intensity: validIntensities.includes(classification.intensity) ? classification.intensity : null,
                context: validContexts.includes(classification.context) ? classification.context : null,
                display_emoji: classification.display_emoji || '📝',
                display_text: (classification.display_text || raw_input.trim()).slice(0, 100),
                longevity_impact: clampedImpact,
                confidence: clampedConfidence,
                log_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single()

        if (insertError) throw new Error(`DB: ${insertError.message}`)

        return new Response(JSON.stringify({
            success: true,
            log: logEntry,
            classification
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
