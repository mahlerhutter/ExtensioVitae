import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Biomarker patterns for extraction
const BIOMARKER_PATTERNS = {
  vitamin_d: /(?:vitamin\s*d|25-oh|calcidiol|25-hydroxyvitamin)[:\s]*(\d+[.,]?\d*)/i,
  b12: /(?:vitamin\s*b12|cobalamin|b-12)[:\s]*(\d+[.,]?\d*)/i,
  ferritin: /ferritin[:\s]*(\d+[.,]?\d*)/i,
  tsh: /(?:tsh|thyrotropin)[:\s]*(\d+[.,]?\d*)/i,
  hba1c: /(?:hba1c|glyk[oä]h[aä]moglobin|a1c)[:\s]*(\d+[.,]?\d*)/i,
  crp: /(?:crp|c-reaktiv|hs-crp)[:\s]*(\d+[.,]?\d*)/i,
  homocysteine: /homocystein[:\s]*(\d+[.,]?\d*)/i,
  ldl: /ldl[:\s-]*(?:cholesterin|c)?[:\s]*(\d+[.,]?\d*)/i,
  hdl: /hdl[:\s-]*(?:cholesterin|c)?[:\s]*(\d+[.,]?\d*)/i,
  triglycerides: /triglycerid[e]?[:\s]*(\d+[.,]?\d*)/i,
  glucose: /(?:glukose|glucose|nüchternzucker)[:\s]*(\d+[.,]?\d*)/i,
  iron: /(?:eisen|iron)[:\s]*(\d+[.,]?\d*)/i,
  zinc: /zink[:\s]*(\d+[.,]?\d*)/i,
  magnesium: /magnesium[:\s]*(\d+[.,]?\d*)/i,
  folate: /(?:fols[aä]ure|folat|folate)[:\s]*(\d+[.,]?\d*)/i,
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
        model: 'claude-sonnet-4-20250514',
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
    ... weitere gefundene Marker
  },
  "raw_text": "Die ersten 500 Zeichen des extrahierten Textes",
  "confidence": 85
}

Wichtige Biomarker (falls vorhanden):
- Vitamin D (25-OH)
- Vitamin B12
- Ferritin, Eisen
- TSH, fT3, fT4
- HbA1c, Glukose
- CRP (hsCRP)
- Homocystein
- LDL, HDL, Triglyceride
- Zink, Magnesium, Folsäure

Wenn ein Wert nicht lesbar ist, weglassen. Bei Unsicherheit "confidence" niedriger setzen.`
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
        raw_text: claudeResponse.content[0].text.substring(0, 500)
      }
    }

    // Normalize biomarker values
    const normalizedBiomarkers: Record<string, number> = {}
    if (parsedData.biomarkers) {
      for (const [key, data] of Object.entries(parsedData.biomarkers)) {
        const value = (data as any)?.value
        if (typeof value === 'number' && !isNaN(value)) {
          normalizedBiomarkers[key] = value
        } else if (typeof value === 'string') {
          const numValue = parseFloat(value.replace(',', '.'))
          if (!isNaN(numValue)) {
            normalizedBiomarkers[key] = numValue
          }
        }
      }
    }

    // Update lab result in database
    const { error: updateError } = await supabase
      .from('lab_results')
      .update({
        lab_date: parsedData.lab_date || new Date().toISOString().split('T')[0],
        lab_provider: parsedData.lab_provider,
        biomarkers: normalizedBiomarkers,
        parsed_data: parsedData.biomarkers,
        ocr_raw_text: parsedData.raw_text,
        ocr_confidence: parsedData.confidence || 50,
        ocr_provider: 'claude',
        parsing_status: Object.keys(normalizedBiomarkers).length > 0 ? 'parsed' : 'failed',
        parsing_errors: Object.keys(normalizedBiomarkers).length === 0
          ? [{ message: 'No biomarkers extracted', timestamp: new Date().toISOString() }]
          : []
      })
      .eq('id', labResultId)

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`)
    }

    // Generate deficiencies based on biomarkers
    const deficiencies = await analyzeDeficiencies(supabase, normalizedBiomarkers)

    // Update deficiencies
    if (deficiencies.length > 0) {
      await supabase
        .from('lab_results')
        .update({ deficiencies })
        .eq('id', labResultId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        labResultId,
        biomarkersFound: Object.keys(normalizedBiomarkers).length,
        biomarkers: normalizedBiomarkers,
        confidence: parsedData.confidence || 50,
        deficiencies
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

// Analyze biomarkers against reference ranges
async function analyzeDeficiencies(supabase: any, biomarkers: Record<string, number>) {
  const deficiencies: Array<{
    code: string;
    name_de: string;
    status: string;
    value: number;
    unit: string;
  }> = []

  try {
    const codes = Object.keys(biomarkers)
    if (codes.length === 0) return deficiencies

    const { data: references, error } = await supabase
      .from('biomarker_references')
      .select('*')
      .in('code', codes)

    if (error || !references) return deficiencies

    for (const ref of references) {
      const value = biomarkers[ref.code]
      if (value === undefined) continue

      let status = 'optimal'

      if (ref.optimal_min !== null && ref.optimal_max !== null) {
        if (value < ref.normal_min) {
          status = 'low'
        } else if (value > ref.normal_max) {
          status = 'high'
        } else if (value < ref.optimal_min) {
          status = 'suboptimal_low'
        } else if (value > ref.optimal_max) {
          status = 'suboptimal_high'
        }
      }

      if (status !== 'optimal') {
        deficiencies.push({
          code: ref.code,
          name_de: ref.name_de,
          status,
          value,
          unit: ref.unit
        })
      }
    }
  } catch (err) {
    console.error('Error analyzing deficiencies:', err)
  }

  return deficiencies
}
