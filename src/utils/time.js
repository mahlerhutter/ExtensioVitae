/**
 * Time utilities for Focus Mode
 */

/**
 * Get current time block based on hour of day
 * @returns {'morning' | 'day' | 'evening'}
 */
export function getCurrentBlock() {
    const hour = new Date().getHours();

    // Morning: 5-11
    if (hour >= 5 && hour < 11) {
        return 'morning';
    }

    // Day: 11-17
    if (hour >= 11 && hour < 17) {
        return 'day';
    }

    // Evening: 17-5 (next day)
    return 'evening';
}

/**
 * Get display name for time block
 * @param {string} block - Time block identifier
 * @returns {string} Display name
 */
export function getBlockDisplayName(block) {
    const names = {
        morning: 'Morgen',
        day: 'Tag',
        evening: 'Abend',
        now: 'Jetzt',
        anytime: 'Jederzeit',
        midday: 'Mittag'
    };

    return names[block] || block;
}

/**
 * Check if a task belongs to the current time block
 * @param {Object} task - Task object
 * @param {string} currentBlock - Current time block
 * @returns {boolean}
 */
export function isTaskInCurrentBlock(task, currentBlock) {
    if (!task.when) return true; // Show tasks without time specification

    const taskTime = task.when.toLowerCase();

    // Map task times to blocks
    if (currentBlock === 'morning') {
        return taskTime === 'morning' || taskTime === 'now';
    }

    if (currentBlock === 'day') {
        return taskTime === 'day' || taskTime === 'midday' || taskTime === 'anytime';
    }

    if (currentBlock === 'evening') {
        return taskTime === 'evening' || taskTime === 'anytime';
    }

    return true;
}
