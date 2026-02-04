import React, { createContext, useContext, useState, useEffect } from 'react';
import { MODES, getModeConfig } from '../lib/modeTypes';
import { logger } from '../lib/logger';

const ModeContext = createContext();

const MODE_STORAGE_KEY = 'extensiovitae_emergency_mode';

export const ModeProvider = ({ children }) => {
    // Initialize mode from localStorage or default to NORMAL
    const [currentMode, setCurrentMode] = useState(() => {
        try {
            const stored = localStorage.getItem(MODE_STORAGE_KEY);
            if (stored) {
                const { mode, timestamp } = JSON.parse(stored);
                // Check if mode is still valid (not expired)
                // For now, modes don't expire, but we could add logic here
                return mode;
            }
        } catch (error) {
            logger.error('Error loading mode from localStorage:', error);
        }
        return MODES.NORMAL;
    });

    const [modeHistory, setModeHistory] = useState([]);
    const [modeActivatedAt, setModeActivatedAt] = useState(null);

    // Persist mode to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify({
                mode: currentMode,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            logger.error('Error saving mode to localStorage:', error);
        }
    }, [currentMode]);

    /**
     * Activate a new emergency mode
     * @param {string} modeId - Mode ID from MODES enum
     * @param {object} metadata - Optional metadata (trigger source, etc.)
     */
    const activateMode = (modeId, metadata = {}) => {
        const previousMode = currentMode;
        const timestamp = new Date().toISOString();

        // Update mode
        setCurrentMode(modeId);
        setModeActivatedAt(timestamp);

        // Add to history
        setModeHistory(prev => [
            ...prev,
            {
                from: previousMode,
                to: modeId,
                timestamp,
                metadata
            }
        ].slice(-10)); // Keep last 10 mode changes

        // Log for analytics (if available)
        if (window.posthog) {
            window.posthog.capture('emergency_mode_activated', {
                mode: modeId,
                previous_mode: previousMode,
                trigger: metadata.trigger || 'manual',
                timestamp
            });
        }

        logger.debug(`🎯 Emergency Mode Activated: ${modeId}`, {
            from: previousMode,
            config: getModeConfig(modeId),
            metadata
        });
    };

    /**
     * Deactivate current mode and return to NORMAL
     */
    const deactivateMode = () => {
        activateMode(MODES.NORMAL, { trigger: 'manual_deactivation' });
    };

    /**
     * Get current mode configuration
     */
    const getCurrentModeConfig = () => {
        return getModeConfig(currentMode);
    };

    /**
     * Check if a specific mode is active
     */
    const isMode = (modeId) => {
        return currentMode === modeId;
    };

    /**
     * Check if any emergency mode is active (not NORMAL)
     */
    const isEmergencyModeActive = () => {
        return currentMode !== MODES.NORMAL;
    };

    /**
     * Get mode duration (how long current mode has been active)
     */
    const getModeDuration = () => {
        if (!modeActivatedAt) return null;
        const now = new Date();
        const activated = new Date(modeActivatedAt);
        const durationMs = now - activated;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours, minutes, totalMinutes: Math.floor(durationMs / (1000 * 60)) };
    };

    /**
     * Check if notifications should be suppressed
     */
    const shouldSuppressNotifications = () => {
        const config = getCurrentModeConfig();
        return config.notifications?.suppress || false;
    };

    /**
     * Get task modifications for current mode
     */
    const getTaskModifications = () => {
        const config = getCurrentModeConfig();
        return config.taskModifications || {};
    };

    /**
     * Check if a task should be shown in current mode
     */
    const shouldShowTask = (task) => {
        const modifications = getTaskModifications();

        // If no filter, show all tasks
        if (!modifications.filter) return true;

        // Check if task pillar is in the filter list
        const taskPillar = task.pillar?.toLowerCase();
        return modifications.filter.includes(taskPillar);
    };

    /**
     * Check if a task should be emphasized in current mode
     */
    const shouldEmphasizeTask = (task) => {
        const modifications = getTaskModifications();
        if (!modifications.emphasize) return false;

        const taskTags = task.tags?.map(t => t.toLowerCase()) || [];
        return modifications.emphasize.some(tag => taskTags.includes(tag));
    };

    /**
     * Check if a task should be suppressed in current mode
     */
    const shouldSuppressTask = (task) => {
        const modifications = getTaskModifications();
        if (!modifications.suppress) return false;

        const taskTags = task.tags?.map(t => t.toLowerCase()) || [];
        return modifications.suppress.some(tag => taskTags.includes(tag));
    };

    const value = {
        // State
        currentMode,
        modeConfig: getCurrentModeConfig(),
        modeHistory,
        modeActivatedAt,

        // Actions
        activateMode,
        deactivateMode,

        // Helpers
        isMode,
        isEmergencyModeActive,
        getModeDuration,
        shouldSuppressNotifications,
        getTaskModifications,
        shouldShowTask,
        shouldEmphasizeTask,
        shouldSuppressTask
    };

    return (
        <ModeContext.Provider value={value}>
            {children}
        </ModeContext.Provider>
    );
};

/**
 * Hook to use mode context
 */
export const useMode = () => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};

export default ModeContext;
