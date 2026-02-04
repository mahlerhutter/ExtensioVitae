import React from 'react';
import { useCalendar } from '../../contexts/CalendarContext';

/**
 * Calendar Settings Component
 * Configure auto-activation and sync preferences
 */
export default function CalendarSettings() {
    const { settings, updateSettings, isConnected } = useCalendar();

    if (!isConnected) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-slate-400 text-sm text-center">
                    Connect your calendar to configure auto-activation settings
                </p>
            </div>
        );
    }

    const handleToggle = (key) => {
        updateSettings({ [key]: !settings[key] });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Auto-Activation Settings</h3>

            <div className="space-y-4">
                {/* Travel Mode */}
                <SettingToggle
                    label="Auto-activate Travel Mode"
                    description="Activate when flights are detected"
                    icon="✈️"
                    enabled={settings.auto_activate_travel}
                    onToggle={() => handleToggle('auto_activate_travel')}
                />

                {/* Deep Work Mode */}
                <SettingToggle
                    label="Auto-activate Deep Work Mode"
                    description="Activate for 4+ hour focus blocks"
                    icon="🎯"
                    enabled={settings.auto_activate_deep_work}
                    onToggle={() => handleToggle('auto_activate_deep_work')}
                />

                {/* Sick Mode */}
                <SettingToggle
                    label="Auto-activate Sick Mode"
                    description="Activate when doctor appointments detected"
                    icon="🩺"
                    enabled={settings.auto_activate_sick}
                    onToggle={() => handleToggle('auto_activate_sick')}
                />

                {/* Busy Week Alerts */}
                <SettingToggle
                    label="Alert on busy weeks"
                    description="Notify when 3+ busy days detected"
                    icon="📅"
                    enabled={settings.alert_busy_weeks}
                    onToggle={() => handleToggle('alert_busy_weeks')}
                />
            </div>

            {/* Sync Frequency */}
            <div className="mt-6 pt-4 border-t border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sync Frequency
                </label>
                <select
                    value={settings.sync_frequency_hours}
                    onChange={(e) => updateSettings({ sync_frequency_hours: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={1}>Every hour</option>
                    <option value={3}>Every 3 hours</option>
                    <option value={6}>Every 6 hours</option>
                    <option value={12}>Every 12 hours</option>
                    <option value={24}>Once per day</option>
                </select>
                <p className="text-slate-500 text-xs mt-1">
                    How often to check for new calendar events
                </p>
            </div>
        </div>
    );
}

/**
 * Setting Toggle Component
 * Individual toggle switch for settings
 */
function SettingToggle({ label, description, icon, enabled, onToggle }) {
    return (
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`
          relative inline-flex h-6 w-11 items-center rounded-full 
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${enabled ? 'bg-blue-500' : 'bg-slate-700'}
        `}
            >
                <span
                    className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
                />
            </button>
        </div>
    );
}
