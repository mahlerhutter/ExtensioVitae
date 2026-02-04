import React from 'react';
import { useMode } from '../contexts/ModeContext';
import { MODES } from '../lib/modeTypes';

/**
 * Mode Indicator Badge
 * Shows current emergency mode in dashboard header
 * Provides quick mode info and duration
 */
export default function ModeIndicator({ showDuration = true, size = 'md' }) {
    const { currentMode, modeConfig, getModeDuration, deactivateMode, isEmergencyModeActive } = useMode();

    // Don't show indicator if in normal mode
    if (!isEmergencyModeActive()) {
        return null;
    }

    const duration = getModeDuration();

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        red: 'bg-red-100 text-red-800 border-red-300',
        green: 'bg-green-100 text-green-800 border-green-300',
        purple: 'bg-purple-100 text-purple-800 border-purple-300'
    };

    const formatDuration = () => {
        if (!duration) return '';
        if (duration.hours > 0) {
            return `${duration.hours}h ${duration.minutes}m`;
        }
        return `${duration.minutes}m`;
    };

    return (
        <div className={`
      inline-flex items-center gap-2 rounded-lg border-2
      ${sizeClasses[size]}
      ${colorClasses[modeConfig.color] || colorClasses.blue}
      font-medium shadow-sm
    `}>
            {/* Icon & Name */}
            <div className="flex items-center gap-1.5">
                <span className="animate-pulse">{modeConfig.icon}</span>
                <span>{modeConfig.name} Mode</span>
            </div>

            {/* Duration */}
            {showDuration && duration && (
                <span className="opacity-75 text-xs">
                    ({formatDuration()})
                </span>
            )}

            {/* Quick Deactivate Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    deactivateMode();
                }}
                className="ml-1 hover:opacity-70 transition-opacity"
                title="Return to Normal Mode"
            >
                ✕
            </button>
        </div>
    );
}

/**
 * Compact Mode Indicator (for mobile/tight spaces)
 */
export function CompactModeIndicator() {
    const { modeConfig, isEmergencyModeActive } = useMode();

    if (!isEmergencyModeActive()) {
        return null;
    }

    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
            <span>{modeConfig.icon}</span>
            <span>{modeConfig.name}</span>
        </div>
    );
}

/**
 * Mode Info Card (detailed view)
 */
export function ModeInfoCard() {
    const { currentMode, modeConfig, getModeDuration, deactivateMode, isEmergencyModeActive } = useMode();

    if (!isEmergencyModeActive()) {
        return null;
    }

    const duration = getModeDuration();

    return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">{modeConfig.icon}</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">{modeConfig.name} Mode</h4>
                        <p className="text-xs text-blue-700">{modeConfig.description}</p>
                    </div>
                </div>
                <button
                    onClick={deactivateMode}
                    className="px-3 py-1 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 transition-colors"
                >
                    Deactivate
                </button>
            </div>

            {/* Focus Areas */}
            <div className="mb-3">
                <p className="text-sm text-blue-800">
                    <strong>Focus:</strong> {modeConfig.focus}
                </p>
            </div>

            {/* Duration */}
            {duration && (
                <div className="text-xs text-blue-700">
                    Active for {duration.hours > 0 ? `${duration.hours}h ` : ''}{duration.minutes}m
                </div>
            )}

            {/* Protocol Adjustments Preview */}
            <div className="mt-3 pt-3 border-t border-blue-300">
                <p className="text-xs text-blue-700 mb-2 font-medium">Protocol Adjustments:</p>
                <div className="flex flex-wrap gap-1">
                    {modeConfig.taskModifications.emphasize?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                            ✓ {tag}
                        </span>
                    ))}
                    {modeConfig.taskModifications.suppress?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            ✕ {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
