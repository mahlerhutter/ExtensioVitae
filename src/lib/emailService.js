/**
 * Email Service for ExtensioVitae
 * Handles all email communications via Supabase Edge Function
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const emailService = {
    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(user, dashboardUrl) {
        return this.sendEmail({
            to: user.email,
            subject: 'Willkommen bei ExtensioVitae 🧬',
            template: 'welcome',
            data: {
                name: user.name || 'dort',
                goal: user.primary_goal,
                dashboardUrl,
                unsubscribeUrl: `${dashboardUrl}/settings`,
            },
        })
    },

    /**
     * Send plan delivery notification
     */
    async sendPlanDelivery(user, planDuration = 30) {
        return this.sendEmail({
            to: user.email,
            subject: `Dein ${planDuration}-Tage Plan ist fertig 🎯`,
            template: 'plan_delivery',
            data: {
                name: user.name || 'dort',
                planDuration,
                dashboardUrl: `${window.location.origin}/dashboard`,
            },
        })
    },

    /**
     * Send daily task nudge
     */
    async sendDailyNudge(user, task, dayNumber) {
        return this.sendEmail({
            to: user.email,
            subject: `Tag ${dayNumber} wartet auf dich`,
            template: 'daily_nudge',
            data: {
                name: user.name || 'dort',
                dayNumber,
                taskTitle: task.title,
                taskDescription: task.description,
                taskDuration: task.duration || 10,
                dashboardUrl: `${window.location.origin}/dashboard`,
            },
        })
    },

    /**
     * Send weekly summary
     */
    async sendWeeklySummary(user, stats) {
        return this.sendEmail({
            to: user.email,
            subject: `Deine Woche: ${stats.completed}/${stats.total} erledigt`,
            template: 'weekly_summary',
            data: {
                name: user.name || 'dort',
                completed: stats.completed,
                total: stats.total,
                pending: stats.pending,
                streak: stats.streak,
                dashboardUrl: `${window.location.origin}/dashboard`,
            },
        })
    },

    /**
     * Send password reset email
     */
    async sendPasswordReset(email, resetUrl) {
        return this.sendEmail({
            to: email,
            subject: 'Passwort zurücksetzen',
            template: 'password_reset',
            data: {
                resetUrl,
            },
        })
    },

    /**
     * Generic email sender (calls Supabase Edge Function)
     */
    async sendEmail({ to, subject, template, data }) {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    to,
                    subject,
                    template,
                    data,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send email')
            }

            const result = await response.json()
            console.log('Email sent successfully:', result.id)
            return result
        } catch (error) {
            console.error('Email service error:', error)
            throw error
        }
    },
}
