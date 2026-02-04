import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin email list (server-side only - not exposed to client)
const ADMIN_EMAILS = [
    'michael@extensiovitae.com',
    'manuelmahlerhutter@gmail.com',
    'admin@extensiovitae.com',
]

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header', isAdmin: false }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with the user's auth token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // Get the user from the auth token
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid auth token', isAdmin: false }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if user email is in admin list
        const userEmail = user.email?.toLowerCase()
        const isAdmin = ADMIN_EMAILS.some(
            (adminEmail) => adminEmail.toLowerCase() === userEmail
        )

        // Log admin access attempts for security monitoring
        console.log(`[Admin Check] User: ${userEmail}, IsAdmin: ${isAdmin}`)

        return new Response(
            JSON.stringify({
                isAdmin,
                email: user.email,
                userId: user.id,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('[Admin Check] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message, isAdmin: false }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
