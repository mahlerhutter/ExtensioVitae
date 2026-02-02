/**
 * Logger Utility for ExtensioVitae
 * 
 * Environment-aware logging system that:
 * - Respects VITE_LOG_LEVEL environment variable
 * - Stores logs in memory for admin viewing
 * - Only logs errors in production by default
 * - Supports multiple log levels
 */

// Log levels
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Get log level from environment or default to INFO in dev, ERROR in prod
const getLogLevel = () => {
    const envLevel = import.meta.env?.VITE_LOG_LEVEL?.toUpperCase();
    const isProd = import.meta.env?.PROD;

    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
        return LOG_LEVELS[envLevel];
    }

    return isProd ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
};

const currentLogLevel = getLogLevel();

// In-memory log storage (max 500 entries)
const MAX_LOGS = 500;
const logStore = [];

// Helper to format timestamp
const getTimestamp = () => {
    return new Date().toISOString();
};

// Helper to store log in memory
const storeLog = (level, message, data) => {
    const logEntry = {
        timestamp: getTimestamp(),
        level,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to avoid mutations
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    logStore.push(logEntry);

    // Keep only the last MAX_LOGS entries
    if (logStore.length > MAX_LOGS) {
        logStore.shift();
    }
};

// Core logging function
const log = (level, levelName, message, ...args) => {
    if (level < currentLogLevel) return;

    const timestamp = getTimestamp();
    const prefix = `[${timestamp}] [${levelName}]`;

    // Store in memory for admin viewing
    storeLog(levelName, message, args.length > 0 ? args : undefined);

    // Console output based on level
    switch (level) {
        case LOG_LEVELS.DEBUG:
            console.debug(prefix, message, ...args);
            break;
        case LOG_LEVELS.INFO:
            console.info(prefix, message, ...args);
            break;
        case LOG_LEVELS.WARN:
            console.warn(prefix, message, ...args);
            break;
        case LOG_LEVELS.ERROR:
            console.error(prefix, message, ...args);
            break;
    }
};

// Public API
export const logger = {
    /**
     * Debug level logging - verbose information for development
     */
    debug: (message, ...args) => {
        log(LOG_LEVELS.DEBUG, 'DEBUG', message, ...args);
    },

    /**
     * Info level logging - general informational messages
     */
    info: (message, ...args) => {
        log(LOG_LEVELS.INFO, 'INFO', message, ...args);
    },

    /**
     * Warning level logging - potentially harmful situations
     */
    warn: (message, ...args) => {
        log(LOG_LEVELS.WARN, 'WARN', message, ...args);
    },

    /**
     * Error level logging - error events
     */
    error: (message, ...args) => {
        log(LOG_LEVELS.ERROR, 'ERROR', message, ...args);
    },

    /**
     * Get all stored logs (for admin viewing)
     */
    getLogs: () => {
        return [...logStore]; // Return a copy
    },

    /**
     * Clear all stored logs
     */
    clearLogs: () => {
        logStore.length = 0;
    },

    /**
     * Get logs filtered by level
     */
    getLogsByLevel: (level) => {
        return logStore.filter(log => log.level === level);
    },

    /**
     * Get current log level
     */
    getLogLevel: () => {
        return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel);
    },

    /**
     * Export logs as JSON
     */
    exportLogs: () => {
        return JSON.stringify(logStore, null, 2);
    },

    /**
     * Export logs as CSV
     */
    exportLogsCSV: () => {
        if (logStore.length === 0) return '';

        const headers = ['Timestamp', 'Level', 'Message', 'Data', 'URL'];
        const rows = logStore.map(log => [
            log.timestamp,
            log.level,
            log.message,
            log.data ? JSON.stringify(log.data) : '',
            log.url
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    }
};

// Expose logger globally for debugging in console
if (typeof window !== 'undefined') {
    window.__logger = logger;
}

export default logger;
