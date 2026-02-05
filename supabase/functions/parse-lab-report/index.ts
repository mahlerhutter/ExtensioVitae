import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { labResultId, fileBase64, fileType } = await req.json()

    if (!labResultId || !fileBase64) {
      throw new Error('Missing required parameters: labResultId and fileBase64')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Anthropic API key
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Determine media type
    const mediaType = fileType?.includes('pdf')
      ? 'application/pdf'
      : fileType?.includes('png')
        ? 'image/png'
        : 'image/jpeg'

    // Call Claude Vision API for OCR
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: fileBase64,
                },
              },
              {
                type: 'text',
                text: `Analysiere dieses Blutbild/Laborbericht. Extrahiere ALLE Biomarker-Werte die du findest.

Antwort NUR als JSON in diesem Format:
{
  "lab_date": "YYYY-MM-DD oder null wenn nicht erkennbar",
  "lab_provider": "Name des Labors oder null",
  "biomarkers": {
    "vitamin_d": {"value": 45.2, "unit": "ng/mL"},
    "ferritin": {"value": 89, "unit": "ng/mL"},
    ... weitere gefundene Marker (nutze englische slugs wie 'tsh', 'ldl', 'hba1c')
  },
  "raw_text": "Die ersten 500 Zeichen des extrahierten Textes zur Kontrolle",
  "confidence": 85
}

Wenn ein Wert nicht lesbar ist, weglassen.
Wenn ranges angegeben sind, ignoriere sie, extrahiere nur den gemessenen Wert.`
              }
            ]
          }
        ]
      }),
    })

    const claudeResponse = await response.json()

    if (claudeResponse.error) {
      throw new Error(`Claude API Error: ${claudeResponse.error.message}`)
    }

    // Extract JSON from Claude's response
    let parsedData
    try {
      if (!claudeResponse.content || !claudeResponse.content[0] || !claudeResponse.content[0].text) {
        throw new Error('Invalid response format from Claude');
      }

      const responseText = claudeResponse.content[0].text
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      parsedData = {
        biomarkers: {},
        confidence: 0,
        raw_text: claudeResponse.content?.[0]?.text || "No content"
      }
    }

    // Update metadata in lab_results and fetch user_id
    // using select().single() to return the updated record + user_id
    const { data: currentLabResult, error: updateError } = await supabase
      .from('lab_results')
      .update({
        test_date: parsedData.lab_date || new Date().toISOString().split('T')[0],
        provider: parsedData.lab_provider || 'Unbekannt',
        status: parsedData.biomarkers && Object.keys(parsedData.biomarkers).length > 0 ? 'completed' : 'failed',
        notes: `Analyzed by Claude. Confidence: ${parsedData.confidence || 0}%`
      })
      .eq('id', labResultId)
      .select('user_id')
      .single()

    if (updateError || !currentLabResult) {
      throw new Error(`Database update error: ${updateError?.message || 'Result not found'}`)
    }

    const userId = currentLabResult.user_id;

    // Insert biomarkers into the new table
    const biomarkerInserts = []
    if (parsedData.biomarkers && Object.keys(parsedData.biomarkers).length > 0) {

      for (const [slug, data] of Object.entries(parsedData.biomarkers)) {
        const item = data as any
        let value = item.value

        // Normalize string numbers
        if (typeof value === 'string') {
          value = parseFloat(value.replace(',', '.'))
        }

        if (typeof value === 'number' && !isNaN(value)) {
          biomarkerInserts.push({
            result_id: labResultId,
            user_id: userId,
            name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/_/g, ' '),
            slug: slug,
            value: value,
            unit: item.unit || '',
            category: 'General'
          })
        }
      }

      if (biomarkerInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('biomarkers')
          .insert(biomarkerInserts)

        if (insertError) {
          console.error('Error inserting biomarkers:', insertError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        labResultId,
        biomarkersFound: biomarkerInserts.length,
        confidence: parsedData.confidence || 50
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Parse lab report error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
