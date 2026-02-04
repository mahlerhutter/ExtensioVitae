/**
 * ExtensioVitae Notification Service
 *
 * Manages notification preferences, scheduling, and delivery.
 * Part of Phase 3: Notification Engine
 */

import { supabase } from './supabase';

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getNotificationPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return existing or default preferences
    return data || {
      user_id: userId,
      push_enabled: true,
      email_enabled: false,
      sms_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      timezone: 'Europe/Vienna',
      task_reminders: true,
      streak_alerts: true,
      weekly_summary: true,
      module_updates: true,
      blood_check_reminders: true,
      achievement_alerts: true,
      reminder_minutes_before: 15,
      max_daily_notifications: 8
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preference updates
 * @returns {Promise<Object>}
 */
export async function updateNotificationPreferences(userId, preferences) {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, preferences: data };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// NOTIFICATION SCHEDULING
// =====================================================

/**
 * Schedule a notification
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>}
 */
export async function scheduleNotification(userId, notification) {
  try {
    // Check preferences
    const prefs = await getNotificationPreferences(userId);
    if (!prefs) {
      return { success: false, error: 'Could not load preferences' };
    }

    // Check if notification type is enabled
    const typeMap = {
      task_reminder: 'task_reminders',
      streak_warning: 'streak_alerts',
      streak_milestone: 'streak_alerts',
      weekly_summary: 'weekly_summary',
      blood_check_due: 'blood_check_reminders',
      achievement: 'achievement_alerts',
      module_reminder: 'module_updates'
    };

    const prefKey = typeMap[notification.type];
    if (prefKey && !prefs[prefKey]) {
      return { success: false, error: 'Notification type disabled by user' };
    }

    // Check quiet hours
    const scheduledTime = new Date(notification.scheduledFor);
    if (isInQuietHours(scheduledTime, prefs.quiet_hours_start, prefs.quiet_hours_end, prefs.timezone)) {
      // Reschedule to after quiet hours
      scheduledTime.setHours(parseInt(prefs.quiet_hours_end.split(':')[0], 10) + 1);
      scheduledTime.setMinutes(0);
    }

    // Check daily limit
    const todayCount = await getTodayNotificationCount(userId);
    if (todayCount >= prefs.max_daily_notifications) {
      return { success: false, error: 'Daily notification limit reached' };
    }

    // Insert notification
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        type: notification.type,
        title_de: notification.title_de,
        title_en: notification.title_en,
        body_de: notification.body_de,
        body_en: notification.body_en,
        action_url: notification.actionUrl,
        scheduled_for: scheduledTime.toISOString(),
        source_module: notification.sourceModule,
        task_id: notification.taskId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule task reminder
 * @param {string} userId - User ID
 * @param {Object} task - Task object
 * @param {Date} taskTime - When task is scheduled
 * @returns {Promise<Object>}
 */
export async function scheduleTaskReminder(userId, task, taskTime) {
  const prefs = await getNotificationPreferences(userId);
  const reminderMinutes = prefs?.reminder_minutes_before || 15;

  const reminderTime = new Date(taskTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

  // Don't schedule if reminder time is in the past
  if (reminderTime < new Date()) {
    return { success: false, error: 'Reminder time is in the past' };
  }

  return scheduleNotification(userId, {
    type: 'task_reminder',
    title_de: `⏰ ${task.title_de}`,
    title_en: `⏰ ${task.title_en || task.title_de}`,
    body_de: `In ${reminderMinutes} Minuten`,
    body_en: `In ${reminderMinutes} minutes`,
    scheduledFor: reminderTime,
    sourceModule: task.source_module,
    taskId: task.task_id
  });
}

/**
 * Schedule streak warning (if user might lose streak)
 * @param {string} userId - User ID
 * @param {number} currentStreak - Current streak
 * @returns {Promise<Object>}
 */
export async function scheduleStreakWarning(userId, currentStreak) {
  if (currentStreak < 3) return { success: false, error: 'Streak too short' };

  // Schedule for 20:00 today
  const warningTime = new Date();
  warningTime.setHours(20, 0, 0, 0);

  // Don't schedule if already past
  if (warningTime < new Date()) {
    return { success: false, error: 'Time passed' };
  }

  return scheduleNotification(userId, {
    type: 'streak_warning',
    title_de: `🔥 ${currentStreak}-Tage Streak in Gefahr!`,
    title_en: `🔥 ${currentStreak}-day streak at risk!`,
    body_de: 'Noch keine Aufgabe heute erledigt. Halte deinen Streak!',
    body_en: 'No tasks completed today. Keep your streak!',
    scheduledFor: warningTime
  });
}

/**
 * Schedule weekly summary
 * @param {string} userId - User ID
 * @param {Object} weekStats - Week statistics
 * @returns {Promise<Object>}
 */
export async function scheduleWeeklySummary(userId, weekStats) {
  // Schedule for Sunday 19:00
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() + (7 - now.getDay()));
  sunday.setHours(19, 0, 0, 0);

  return scheduleNotification(userId, {
    type: 'weekly_summary',
    title_de: '📊 Dein Wochen-Rückblick',
    title_en: '📊 Your Weekly Summary',
    body_de: `${weekStats.tasksCompleted}/${weekStats.tasksTotal} Aufgaben (${weekStats.completionRate}%)`,
    body_en: `${weekStats.tasksCompleted}/${weekStats.tasksTotal} tasks (${weekStats.completionRate}%)`,
    scheduledFor: sunday
  });
}

/**
 * Schedule blood check reminder
 * @param {string} userId - User ID
 * @param {number} daysSinceLastCheck - Days since last blood check
 * @returns {Promise<Object>}
 */
export async function scheduleBloodCheckReminder(userId, daysSinceLastCheck) {
  if (daysSinceLastCheck < 85) {
    return { success: false, error: 'Too early for reminder' };
  }

  const reminderTime = new Date();
  reminderTime.setHours(10, 0, 0, 0);
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  return scheduleNotification(userId, {
    type: 'blood_check_due',
    title_de: '🩸 Zeit für ein neues Blutbild',
    title_en: '🩸 Time for a new blood panel',
    body_de: `Letztes Blutbild vor ${daysSinceLastCheck} Tagen. Termin buchen!`,
    body_en: `Last blood panel ${daysSinceLastCheck} days ago. Book an appointment!`,
    scheduledFor: reminderTime,
    actionUrl: '/health-profile#blood-check'
  });
}

/**
 * Send achievement notification
 * @param {string} userId - User ID
 * @param {Object} achievement - Achievement data
 * @returns {Promise<Object>}
 */
export async function sendAchievementNotification(userId, achievement) {
  return scheduleNotification(userId, {
    type: 'achievement',
    title_de: `🏆 ${achievement.name_de} erreicht!`,
    title_en: `🏆 ${achievement.name_en} earned!`,
    body_de: `Glückwunsch! Du hast "${achievement.name_de}" freigeschaltet.`,
    body_en: `Congratulations! You've unlocked "${achievement.name_en}".`,
    scheduledFor: new Date() // Immediate
  });
}

// =====================================================
// NOTIFICATION DELIVERY
// =====================================================

/**
 * Get pending notifications for delivery
 * @returns {Promise<Array>}
 */
export async function getPendingNotifications() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    return [];
  }
}

/**
 * Mark notification as sent
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>}
 */
export async function markNotificationSent(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    console.error('Error marking notification sent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark notification as opened
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>}
 */
export async function markNotificationOpened(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    console.error('Error marking notification opened:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's notification history
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>}
 */
export async function getNotificationHistory(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['sent', 'opened'])
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return [];
  }
}

// =====================================================
// PUSH NOTIFICATIONS (Web Push)
// =====================================================

/**
 * Request push notification permission
 * @returns {Promise<boolean>}
 */
export async function requestPushPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function subscribeToPush(userId) {
  try {
    const hasPermission = await requestPushPermission();
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }

    // Register service worker if not already
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Save subscription to backend
      const { error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          userId,
          subscription: subscription.toJSON()
        }
      });

      if (error) throw error;

      return { success: true };
    }

    return { success: false, error: 'Service worker not supported' };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Show local notification (for testing or fallback)
 * @param {Object} notification - Notification data
 */
export function showLocalNotification(notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Cannot show notification');
    return;
  }

  const title = notification.title_de || notification.title_en;
  const options = {
    body: notification.body_de || notification.body_en,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: notification.id || 'extensio-notification',
    data: {
      url: notification.action_url
    }
  };

  new Notification(title, options);
}

// =====================================================
// HELPERS
// =====================================================

function isInQuietHours(time, quietStart, quietEnd, timezone) {
  // Simple check (doesn't handle timezone properly yet)
  const hours = time.getHours();
  const startHour = parseInt(quietStart.split(':')[0], 10);
  const endHour = parseInt(quietEnd.split(':')[0], 10);

  if (startHour > endHour) {
    // Quiet hours span midnight
    return hours >= startHour || hours < endHour;
  }
  return hours >= startHour && hours < endHour;
}

async function getTodayNotificationCount(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('notification_queue')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('scheduled_for', `${today}T00:00:00`)
    .lte('scheduled_for', `${today}T23:59:59`);

  if (error) return 0;
  return count || 0;
}

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();

  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
  scheduleNotification,
  scheduleTaskReminder,
  scheduleStreakWarning,
  scheduleWeeklySummary,
  scheduleBloodCheckReminder,
  sendAchievementNotification,
  getPendingNotifications,
  markNotificationSent,
  markNotificationOpened,
  getNotificationHistory,
  requestPushPermission,
  subscribeToPush,
  showLocalNotification
};
