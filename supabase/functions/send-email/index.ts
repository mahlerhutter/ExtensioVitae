import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
    to: string
    subject: string
    template: 'welcome' | 'plan_delivery' | 'daily_nudge' | 'weekly_summary' | 'password_reset'
    data: Record<string, any>
}

serve(async (req) => {
    try {
        // CORS headers
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            })
        }

        // Verify Resend API key
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured')
        }

        // Parse request
        const { to, subject, template, data }: EmailRequest = await req.json()

        // Get email HTML based on template
        const html = getEmailTemplate(template, data)

        // Send via Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'ExtensioVitae <noreply@extensiovitae.com>',
                to: [to],
                subject,
                html,
            }),
        })

        if (!resendResponse.ok) {
            const error = await resendResponse.text()
            throw new Error(`Resend API error: ${error}`)
        }

        const result = await resendResponse.json()

        // Log email to database
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        )

        await supabaseClient.from('email_logs').insert({
            email_type: template,
            subject,
            resend_id: result.id,
            status: 'sent',
        })

        return new Response(JSON.stringify({ success: true, id: result.id }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    }
})

function getEmailTemplate(template: string, data: Record<string, any>): string {
    const templates = {
        welcome: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧬 ExtensioVitae</h1>
            </div>
            <h2>Willkommen, ${data.name}!</h2>
            <p>Dein persönlicher 30-Tage Longevity Plan ist fertig.</p>
            <p><strong>Dein Fokus:</strong> ${data.goal || 'Optimale Gesundheit'}</p>
            <p><a href="${data.dashboardUrl}" class="button">Plan ansehen →</a></p>
            <div class="footer">
              <p>Du erhältst maximal 2 Emails pro Woche.</p>
              <p><a href="${data.unsubscribeUrl}">Einstellungen</a> | <a href="${data.unsubscribeUrl}">Abmelden</a></p>
            </div>
          </div>
        </body>
      </html>
    `,

        plan_delivery: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎯 Dein neuer Plan ist da</h2>
            <p>Hallo ${data.name},</p>
            <p>Dein ${data.planDuration}-Tage Plan wurde erfolgreich erstellt.</p>
            <p><a href="${data.dashboardUrl}" class="button">Jetzt starten →</a></p>
          </div>
        </body>
      </html>
    `,

        daily_nudge: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .task-card { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Tag ${data.dayNumber} wartet auf dich</h2>
            <p>Hallo ${data.name},</p>
            <div class="task-card">
              <h3>${data.taskTitle}</h3>
              <p>${data.taskDescription}</p>
              <p><strong>Dauer:</strong> ${data.taskDuration} min</p>
            </div>
            <p><a href="${data.dashboardUrl}" class="button">Jetzt erledigen →</a></p>
          </div>
        </body>
      </html>
    `,

        weekly_summary: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat { flex: 1; text-align: center; background: #f9fafb; padding: 16px; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>📊 Deine Woche: ${data.completed}/${data.total} erledigt</h2>
            <p>Hallo ${data.name},</p>
            <div class="stats">
              <div class="stat">
                <h3>✅ ${data.completed}</h3>
                <p>Erledigt</p>
              </div>
              <div class="stat">
                <h3>⏳ ${data.pending}</h3>
                <p>Offen</p>
              </div>
              <div class="stat">
                <h3>🔥 ${data.streak}</h3>
                <p>Streak (Tage)</p>
              </div>
            </div>
            <p><a href="${data.dashboardUrl}" class="button">Weiter geht's →</a></p>
          </div>
        </body>
      </html>
    `,

        password_reset: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔐 Passwort zurücksetzen</h2>
            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
            <p><a href="${data.resetUrl}" class="button">Passwort zurücksetzen →</a></p>
            <p>Dieser Link ist 1 Stunde gültig.</p>
            <p><small>Falls du diese Anfrage nicht gestellt hast, ignoriere diese Email.</small></p>
          </div>
        </body>
      </html>
    `,
    }

    return templates[template] || templates.welcome
}
