import React from 'react';
import { useMode } from '../contexts/ModeContext';
import { MODES, MODE_CONFIGS } from '../lib/modeTypes';

/**
 * Emergency Mode Selector
 * One-tap activation for 4 emergency modes
 * Based on VISION.md Horizon 1 specs
 */
export default function ModeSelector({ compact = false }) {
    const { currentMode, activateMode, deactivateMode } = useMode();

    const modes = [
        MODE_CONFIGS[MODES.TRAVEL],
        MODE_CONFIGS[MODES.SICK],
        MODE_CONFIGS[MODES.DETOX],
        MODE_CONFIGS[MODES.DEEP_WORK]
    ];

    const handleModeClick = (modeId) => {
        if (currentMode === modeId) {
            // Deactivate if clicking current mode
            deactivateMode();
        } else {
            // Activate new mode
            activateMode(modeId, { trigger: 'manual_ui' });
        }
    };

    // Static color classes for Tailwind (dynamic classes don't work)
    const getActiveClasses = (color) => {
        const classes = {
            blue: 'bg-blue-500 text-white shadow-md scale-105',
            red: 'bg-red-500 text-white shadow-md scale-105',
            green: 'bg-green-500 text-white shadow-md scale-105',
            purple: 'bg-purple-500 text-white shadow-md scale-105'
        };
        return classes[color] || classes.blue;
    };

    const getInactiveClasses = (color) => {
        const classes = {
            blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
            red: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
            green: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
        };
        return classes[color] || classes.blue;
    };

    if (compact) {
        return (
            <div className="flex gap-2 flex-wrap">
                {modes.map(mode => {
                    const isActive = currentMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => handleModeClick(mode.id)}
                            className={`
                px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive ? getActiveClasses(mode.color) : getInactiveClasses(mode.color)}
              `}
                            title={mode.description}
                        >
                            <span className="mr-1">{mode.icon}</span>
                            {mode.name}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Emergency Mode</h3>
                <p className="text-sm text-slate-600 mt-1">
                    One-tap protocol reconfiguration for specific contexts
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modes.map(mode => {
                    const isActive = currentMode === mode.id;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => handleModeClick(mode.id)}
                            className={`
                relative p-4 rounded-lg text-left
                transition-all duration-200
                ${isActive
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02] ring-2 ring-blue-400 ring-offset-2'
                                    : 'bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300'
                                }
              `}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                </div>
                            )}

                            {/* Icon & Name */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{mode.icon}</span>
                                <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                    {mode.name}
                                </span>
                            </div>

                            {/* Description */}
                            <p className={`text-sm mb-2 ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>
                                {mode.description}
                            </p>

                            {/* Focus Areas */}
                            <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                                Focus: {mode.focus}
                            </div>

                            {/* Active State Label */}
                            {isActive && (
                                <div className="mt-3 pt-3 border-t border-blue-400">
                                    <span className="text-xs font-medium text-blue-100">
                                        ✓ Active - Tap to deactivate
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Current Mode Info */}
            {currentMode !== MODES.NORMAL && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium text-sm">
                                {MODE_CONFIGS[currentMode].icon} {MODE_CONFIGS[currentMode].name} Mode Active
                            </span>
                        </div>
                        <button
                            onClick={deactivateMode}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                            Return to Normal
                        </button>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="mt-4 text-xs text-slate-500">
                <p>
                    <strong>Hostile Test:</strong> User at airport, phone dying → Single button press before boarding ✓
                </p>
            </div>
        </div>
    );
}
