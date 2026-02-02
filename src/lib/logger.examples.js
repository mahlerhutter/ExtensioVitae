/**
 * Logger Usage Examples
 * 
 * This file demonstrates how to use the logger utility in different scenarios.
 */

import logger from './logger';

// ============================================
// BASIC USAGE
// ============================================

// Info level - general information
logger.info('[Dashboard] User loaded successfully');
logger.info('[Supabase] Fetching plans for user:', userId);

// Warning level - potentially harmful situations
logger.warn('[DataService] Using localStorage fallback - Supabase not configured');
logger.warn('[Auth] Session expired, redirecting to login');

// Error level - error events
logger.error('[Supabase] Failed to save plan:', error);
logger.error('[Dashboard] Plan generation failed:', error.message);

// Debug level - verbose information (only in development)
logger.debug('[PlanBuilder] Calculating task scores:', taskScores);
logger.debug('[LLM] API response:', response);

// ============================================
// WITH CONTEXT DATA
// ============================================

// Pass additional data as arguments
logger.info('[Dashboard] Loading plan', { planId, userId });
logger.error('[Supabase] Query failed', { query, error, timestamp: Date.now() });

// Multiple arguments
logger.info('[Auth] User signed in', user.email, user.id);

// ============================================
// CONTEXT PREFIXES (RECOMMENDED)
// ============================================

// Use consistent prefixes for easy filtering
// [ComponentName] or [ServiceName] format

// Supabase operations
logger.info('[Supabase] Connecting to database');
logger.error('[Supabase] Connection failed:', error);

// Dashboard operations
logger.info('[Dashboard] Rendering day view', { day: currentDay });
logger.warn('[Dashboard] No active plan found');

// Authentication
logger.info('[Auth] Checking session');
logger.error('[Auth] Authentication failed:', error);

// Data service
logger.info('[DataService] Saving to localStorage');
logger.warn('[DataService] Data migration needed');

// Admin operations
logger.info('[Admin] Loading admin data');
logger.error('[Admin] Cleanup failed:', error);

// Plan generation
logger.info('[PlanGen] Starting plan generation');
logger.debug('[PlanGen] Task selection complete', { tasks });

// LLM operations
logger.info('[LLM] Calling Claude API');
logger.error('[LLM] API rate limit exceeded');

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all logs (for admin viewing)
const allLogs = logger.getLogs();
console.log('Total logs:', allLogs.length);

// Get logs by level
const errors = logger.getLogsByLevel('ERROR');
console.log('Error count:', errors.length);

// Export logs
const jsonExport = logger.exportLogs();
const csvExport = logger.exportLogsCSV();

// Clear logs
logger.clearLogs();

// Check current log level
const currentLevel = logger.getLogLevel();
console.log('Current log level:', currentLevel); // 'INFO', 'ERROR', etc.

// ============================================
// DEBUGGING IN CONSOLE
// ============================================

// Logger is exposed globally as window.__logger
// In browser console, you can:

// View all logs
window.__logger.getLogs()

// View only errors
window.__logger.getLogsByLevel('ERROR')

// Export logs
window.__logger.exportLogs()

// Clear logs
window.__logger.clearLogs()

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

// Set in .env.development
// VITE_LOG_LEVEL=DEBUG  # Most verbose

// Set in .env.production
// VITE_LOG_LEVEL=ERROR  # Only errors

// Available levels (in order of verbosity):
// - DEBUG: All logs (most verbose)
// - INFO: Info, Warn, Error
// - WARN: Warn, Error
// - ERROR: Only errors
// - NONE: No logs

// ============================================
// BEST PRACTICES
// ============================================

// ✅ DO: Use context prefixes
logger.info('[Dashboard] Loading user data');

// ❌ DON'T: Generic messages
logger.info('Loading data');

// ✅ DO: Include relevant data
logger.error('[Supabase] Query failed', { query, error });

// ❌ DON'T: Log sensitive data
logger.info('[Auth] User password:', password); // NEVER DO THIS!

// ✅ DO: Use appropriate levels
logger.debug('[PlanBuilder] Internal state:', state); // Verbose, dev only
logger.info('[Dashboard] Plan loaded'); // General info
logger.warn('[DataService] Fallback mode active'); // Potential issue
logger.error('[Supabase] Database error:', error); // Actual error

// ✅ DO: Log errors with context
try {
    await savePlan(plan);
} catch (error) {
    logger.error('[Dashboard] Failed to save plan', { planId: plan.id, error });
    throw error;
}

// ❌ DON'T: Swallow errors silently
try {
    await savePlan(plan);
} catch (error) {
    // Silent failure - BAD!
}

// ============================================
// MIGRATION FROM console.log
// ============================================

// Before
console.log('Plan created:', plan.id);
console.error('Error:', error);

// After
logger.info('[Dashboard] Plan created:', plan.id);
logger.error('[Dashboard] Error:', error);

export default logger;
