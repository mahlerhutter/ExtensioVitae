import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            })
        }

        if (!TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN not configured')
        }

        const update = await req.json()
        console.log('Telegram webhook received:', JSON.stringify(update))

        // Handle message
        if (update.message) {
            const message = update.message
            const chatId = message.chat.id
            const text = message.text || ''
            const userId = message.from.id

            // Initialize Supabase client
            const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

            // Handle commands
            if (text.startsWith('/start')) {
                await handleStartCommand(chatId, userId, supabase)
            } else if (text.startsWith('/status')) {
                await handleStatusCommand(chatId, userId, supabase)
            } else if (text.startsWith('/today')) {
                await handleTodayCommand(chatId, userId, supabase)
            } else if (text.startsWith('/done')) {
                await handleDoneCommand(chatId, userId, text, supabase)
            } else if (text.startsWith('/help')) {
                await handleHelpCommand(chatId)
            } else {
                // Unknown command
                await sendMessage(chatId, '❓ Unbekannter Befehl. Nutze /help für eine Liste aller Befehle.')
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Telegram webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})

// Command Handlers

async function handleStartCommand(chatId: number, telegramUserId: number, supabase: any) {
    // Check if user already linked
    const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('telegram_chat_id', chatId)
        .single()

    if (existingUser) {
        await sendMessage(
            chatId,
            `👋 Willkommen zurück, ${existingUser.name || 'dort'}!\n\n` +
            `Du bist bereits mit ExtensioVitae verbunden.\n\n` +
            `Nutze /status für deinen aktuellen Fortschritt.`
        )
        return
    }

    // New user - send linking instructions
    await sendMessage(
        chatId,
        `🧬 **ExtensioVitae Telegram Bot**\n\n` +
        `Willkommen! Um deinen Account zu verbinden:\n\n` +
        `1. Gehe zu extensiovitae.com/settings\n` +
        `2. Klicke auf "Telegram verbinden"\n` +
        `3. Gib diesen Code ein: \`${chatId}\`\n\n` +
        `Danach kannst du tägliche Updates und Erinnerungen hier empfangen! 🚀`,
        { parse_mode: 'Markdown' }
    )
}

async function handleStatusCommand(chatId: number, telegramUserId: number, supabase: any) {
    // Get user by telegram_chat_id
    const { data: user } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('telegram_chat_id', chatId)
        .single()

    if (!user) {
        await sendMessage(chatId, '❌ Account nicht verbunden. Nutze /start um zu beginnen.')
        return
    }

    // Get active plan
    const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!plan) {
        await sendMessage(chatId, '📋 Du hast noch keinen aktiven Plan. Erstelle einen auf extensiovitae.com!')
        return
    }

    // Calculate progress
    const totalDays = plan.duration || 30
    const currentDay = Math.min(
        Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        totalDays
    )
    const progress = Math.round((currentDay / totalDays) * 100)

    // Get completed tasks count (simplified - would need task completion tracking)
    const completedTasks = plan.completed_tasks || 0
    const totalTasks = totalDays * 3 // Assuming ~3 tasks per day

    await sendMessage(
        chatId,
        `📊 **Dein Status**\n\n` +
        `👤 ${user.name || 'Unbekannt'}\n` +
        `📅 Tag ${currentDay}/${totalDays} (${progress}%)\n` +
        `✅ ${completedTasks}/${totalTasks} Aufgaben erledigt\n\n` +
        `Nutze /today für die heutigen Aufgaben.`,
        { parse_mode: 'Markdown' }
    )
}

async function handleTodayCommand(chatId: number, telegramUserId: number, supabase: any) {
    const { data: user } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single()

    if (!user) {
        await sendMessage(chatId, '❌ Account nicht verbunden. Nutze /start.')
        return
    }

    // Get active plan
    const { data: plan } = await supabase
        .from('plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!plan) {
        await sendMessage(chatId, '📋 Kein aktiver Plan gefunden.')
        return
    }

    // Get current day
    const currentDay = Math.min(
        Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        plan.duration || 30
    )

    const dayData = plan.plan_data?.days?.[currentDay - 1]

    if (!dayData) {
        await sendMessage(chatId, '❓ Keine Aufgaben für heute gefunden.')
        return
    }

    const tasks = dayData.tasks || []
    const taskList = tasks
        .map((task: any, i: number) => `${i + 1}. ${task.title} (${task.duration || 10} min)`)
        .join('\n')

    await sendMessage(
        chatId,
        `📅 **Tag ${currentDay}: ${dayData.title || 'Dein Plan'}**\n\n` +
        `${taskList}\n\n` +
        `Markiere Aufgaben als erledigt mit /done [Nummer]`,
        { parse_mode: 'Markdown' }
    )
}

async function handleDoneCommand(chatId: number, telegramUserId: number, text: string, supabase: any) {
    const taskNumber = parseInt(text.split(' ')[1])

    if (!taskNumber) {
        await sendMessage(chatId, '❌ Bitte gib eine Aufgabennummer an: /done 1')
        return
    }

    await sendMessage(chatId, `✅ Aufgabe ${taskNumber} als erledigt markiert! Gut gemacht! 🎉`)
}

async function handleHelpCommand(chatId: number) {
    await sendMessage(
        chatId,
        `🤖 **ExtensioVitae Bot Befehle**\n\n` +
        `/start - Account verbinden\n` +
        `/status - Aktueller Fortschritt\n` +
        `/today - Heutige Aufgaben\n` +
        `/done [Nr] - Aufgabe abhaken\n` +
        `/help - Diese Hilfe\n\n` +
        `Fragen? → support@extensiovitae.com`,
        { parse_mode: 'Markdown' }
    )
}

// Telegram API Helper
async function sendMessage(chatId: number, text: string, options: any = {}) {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            ...options
        })
    })

    if (!response.ok) {
        const error = await response.text()
        console.error('Telegram API error:', error)
        throw new Error(`Failed to send message: ${error}`)
    }

    return response.json()
}
