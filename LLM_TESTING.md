# LLM Testing - Manual Deployment Guide

**Problem:** Supabase CLI installation has permission issues  
**Solution:** Deploy Edge Function via Supabase Dashboard (Web UI)

---

## 🚀 Deploy Edge Function via Dashboard

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `qnjjusilviwvovrlunep`
3. Navigate to: **Edge Functions** (in left sidebar)

### Step 2: Create New Function

1. Click **"Create a new function"**
2. Name: `generate-plan-proxy`
3. Click **"Create function"**

### Step 3: Paste Function Code

Copy the entire content from:
`supabase/functions/generate-plan-proxy/index.ts`

**Or use this code:**

\`\`\`typescript
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

        // 1. OpenAI Implementation
        if (provider === 'openai') {
            const apiKey = Deno.env.get('OPENAI_API_KEY')
            if (!apiKey) throw new Error('OpenAI API key not configured')

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${apiKey}\`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: \`You are ExtensioVitae, a longevity lifestyle optimization assistant. 
              Respond with valid JSON only. 
              NEVER make medical claims.
              Respond in German language.\`
                        },
                        {
                            role: 'user',
                            content: \`Generate a personalized 30-day longevity plan for this user:\\n\\n\${JSON.stringify(intakeData)}\\n\\nRespond with valid JSON.\`
                        }
                    ],
                    response_format: { type: 'json_object' }
                }),
            })

            const data = await response.json()
            if (data.error) throw new Error(\`OpenAI Error: \${data.error.message}\`)

            return new Response(JSON.stringify(JSON.parse(data.choices[0].message.content)), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(\`Unknown provider: \${provider}\`)

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
\`\`\`

### Step 4: Configure Environment Variables

1. In the Edge Function editor, click **"Secrets"** tab
2. Add secret:
   - Key: `OPENAI_API_KEY`
   - Value: `your_openai_api_key_here`
3. Click **"Save"**

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for deployment to complete (~30 seconds)
3. Copy the function URL (should be something like):
   ```
   https://qnjjusilviwvovrlunep.supabase.co/functions/v1/generate-plan-proxy
   ```

---

## 🧪 Test the Edge Function

### Option A: Test via Dashboard

1. In Edge Function page, click **"Invoke"** tab
2. Paste test payload:
   \`\`\`json
   {
     "intakeData": {
       "age": 35,
       "goals": ["longevity", "energy"],
       "time_available": 30,
       "health_conditions": [],
       "activity_level": "moderate"
     },
     "provider": "openai"
   }
   \`\`\`
3. Click **"Invoke function"**
4. Check response

### Option B: Test via curl

\`\`\`bash
curl -X POST \
  'https://qnjjusilviwvovrlunep.supabase.co/functions/v1/generate-plan-proxy' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "intakeData": {
      "age": 35,
      "goals": ["longevity", "energy"],
      "time_available": 30
    },
    "provider": "openai"
  }'
\`\`\`

### Option C: Test in App

1. Go to `http://localhost:3100/intake`
2. Fill out questionnaire
3. Submit
4. Check browser console for logs
5. Verify plan generation

---

## ✅ Expected Results

**Success Response:**
\`\`\`json
{
  "plan_name": "Dein 30-Tage Longevity Plan",
  "days": [
    {
      "day": 1,
      "tasks": [...]
    }
  ],
  "pillars": {...}
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "error": "OpenAI API key not configured"
}
\`\`\`

---

## 🔧 Troubleshooting

### "OpenAI API key not configured"
- Go to Edge Function → Secrets
- Verify `OPENAI_API_KEY` is set
- Redeploy function

### "CORS error"
- Check `corsHeaders` in function code
- Verify `Access-Control-Allow-Origin: *` is set

### "Function not found"
- Verify function name is exactly: `generate-plan-proxy`
- Check deployment status in Dashboard

### "Invalid JSON response"
- Check OpenAI API response in function logs
- Verify `response_format: { type: 'json_object' }` is set

---

## 📝 Next Steps

**After successful test:**
1. ✅ Edge Function is deployed
2. ✅ LLM plan generation works
3. ✅ App can use LLM or fallback to deterministic
4. 🚀 Ready to deploy!

**If test fails:**
1. Check function logs in Dashboard
2. Verify OpenAI API key is valid
3. Test with simpler payload
4. Fall back to deterministic plans (already working)

---

## 💡 Alternative: Skip LLM for MVP

**If Edge Function deployment is too complex:**
- ✅ App already works with deterministic plans
- ✅ Users get personalized plans
- ✅ Can add LLM later
- 🚀 Deploy now, iterate later

**Recommendation:** Deploy with deterministic plans, add LLM post-launch based on user feedback.
