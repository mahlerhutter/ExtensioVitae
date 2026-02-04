import React, { useState, useEffect } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  requestPushPermission,
  subscribeToPush
} from '../../lib/notificationService';

/**
 * Notification Settings Component
 *
 * Manages notification preferences and push subscription.
 */
export default function NotificationSettings({ userId, language = 'de' }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [pushStatus, setPushStatus] = useState('unknown');

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, [userId]);

  const loadPreferences = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const prefs = await getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = () => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
    } else if (Notification.permission === 'granted') {
      setPushStatus('granted');
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied');
    } else {
      setPushStatus('default');
    }
  };

  const handleToggle = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    setSaving(true);
    try {
      await updateNotificationPreferences(userId, { [key]: value });
    } catch (error) {
      console.error('Error saving preference:', error);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      setPushStatus('granted');
      const result = await subscribeToPush(userId);
      if (result.success) {
        handleToggle('push_enabled', true);
      }
    } else {
      setPushStatus('denied');
    }
  };

  const handleTimeChange = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    setSaving(true);
    try {
      await updateNotificationPreferences(userId, { [key]: value });
    } catch (error) {
      console.error('Error saving preference:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = {
    title: language === 'de' ? 'Benachrichtigungen' : 'Notifications',
    pushNotifications: language === 'de' ? 'Push-Benachrichtigungen' : 'Push Notifications',
    enablePush: language === 'de' ? 'Push aktivieren' : 'Enable Push',
    pushDenied: language === 'de' ? 'Push blockiert' : 'Push blocked',
    pushUnsupported: language === 'de' ? 'Nicht unterstützt' : 'Not supported',
    notificationTypes: language === 'de' ? 'Benachrichtigungstypen' : 'Notification Types',
    taskReminders: language === 'de' ? 'Aufgaben-Erinnerungen' : 'Task Reminders',
    taskRemindersDesc: language === 'de' ? 'Vor geplanten Aufgaben erinnern' : 'Remind before scheduled tasks',
    streakAlerts: language === 'de' ? 'Streak-Warnungen' : 'Streak Alerts',
    streakAlertsDesc: language === 'de' ? 'Warnung wenn Streak gefährdet' : 'Warning when streak at risk',
    weeklySummary: language === 'de' ? 'Wochen-Zusammenfassung' : 'Weekly Summary',
    weeklySummaryDesc: language === 'de' ? 'Sonntags Rückblick' : 'Sunday recap',
    bloodCheck: language === 'de' ? 'Blutbild-Erinnerungen' : 'Blood Check Reminders',
    bloodCheckDesc: language === 'de' ? 'Wenn neues Blutbild fällig' : 'When new blood panel due',
    achievements: language === 'de' ? 'Erfolgs-Benachrichtigungen' : 'Achievement Notifications',
    achievementsDesc: language === 'de' ? 'Neue Erfolge feiern' : 'Celebrate new achievements',
    quietHours: language === 'de' ? 'Ruhezeiten' : 'Quiet Hours',
    quietHoursDesc: language === 'de' ? 'Keine Benachrichtigungen zwischen' : 'No notifications between',
    reminderTime: language === 'de' ? 'Erinnerungsvorlauf' : 'Reminder Lead Time',
    minutesBefore: language === 'de' ? 'Minuten vorher' : 'minutes before',
    dailyLimit: language === 'de' ? 'Tägliches Limit' : 'Daily Limit',
    maxNotifications: language === 'de' ? 'max. Benachrichtigungen' : 'max notifications'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
        {saving && (
          <span className="text-sm text-slate-400">
            {language === 'de' ? 'Speichern...' : 'Saving...'}
          </span>
        )}
      </div>

      {/* Push Notifications */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">{t.pushNotifications}</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {pushStatus === 'granted' && (language === 'de' ? 'Aktiviert' : 'Enabled')}
              {pushStatus === 'denied' && t.pushDenied}
              {pushStatus === 'unsupported' && t.pushUnsupported}
              {pushStatus === 'default' && (language === 'de' ? 'Nicht aktiviert' : 'Not enabled')}
            </p>
          </div>
          {pushStatus === 'default' && (
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg text-sm transition-colors"
            >
              {t.enablePush}
            </button>
          )}
          {pushStatus === 'granted' && (
            <ToggleSwitch
              enabled={preferences?.push_enabled}
              onChange={(v) => handleToggle('push_enabled', v)}
            />
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-white font-medium mb-4">{t.notificationTypes}</h3>
        <div className="space-y-4">
          <NotificationToggle
            label={t.taskReminders}
            description={t.taskRemindersDesc}
            enabled={preferences?.task_reminders}
            onChange={(v) => handleToggle('task_reminders', v)}
          />
          <NotificationToggle
            label={t.streakAlerts}
            description={t.streakAlertsDesc}
            enabled={preferences?.streak_alerts}
            onChange={(v) => handleToggle('streak_alerts', v)}
          />
          <NotificationToggle
            label={t.weeklySummary}
            description={t.weeklySummaryDesc}
            enabled={preferences?.weekly_summary}
            onChange={(v) => handleToggle('weekly_summary', v)}
          />
          <NotificationToggle
            label={t.bloodCheck}
            description={t.bloodCheckDesc}
            enabled={preferences?.blood_check_reminders}
            onChange={(v) => handleToggle('blood_check_reminders', v)}
          />
          <NotificationToggle
            label={t.achievements}
            description={t.achievementsDesc}
            enabled={preferences?.achievement_alerts}
            onChange={(v) => handleToggle('achievement_alerts', v)}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-white font-medium mb-2">{t.quietHours}</h3>
        <p className="text-sm text-slate-400 mb-4">{t.quietHoursDesc}</p>
        <div className="flex items-center gap-3">
          <TimeSelect
            value={preferences?.quiet_hours_start || '22:00'}
            onChange={(v) => handleTimeChange('quiet_hours_start', v)}
          />
          <span className="text-slate-400">–</span>
          <TimeSelect
            value={preferences?.quiet_hours_end || '07:00'}
            onChange={(v) => handleTimeChange('quiet_hours_end', v)}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="space-y-4">
          {/* Reminder time */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white">{t.reminderTime}</span>
              <p className="text-sm text-slate-400">{t.minutesBefore}</p>
            </div>
            <select
              value={preferences?.reminder_minutes_before || 15}
              onChange={(e) => handleTimeChange('reminder_minutes_before', parseInt(e.target.value))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          {/* Daily limit */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white">{t.dailyLimit}</span>
              <p className="text-sm text-slate-400">{t.maxNotifications}</p>
            </div>
            <select
              value={preferences?.max_daily_notifications || 8}
              onChange={(e) => handleTimeChange('max_daily_notifications', parseInt(e.target.value))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-amber-500' : 'bg-slate-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Notification Toggle Row
function NotificationToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <span className="text-white">{label}</span>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

// Time Select Component
function TimeSelect({ value, onChange }) {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0') + ':00'
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
    >
      {hours.map(hour => (
        <option key={hour} value={hour}>{hour}</option>
      ))}
    </select>
  );
}
