# Logger Migration Guide

This document provides a systematic approach to replacing all `console.log` statements with the new `logger` utility.

## Quick Reference

### Import Statement
```javascript
import logger from '../lib/logger';
```

### Replacement Patterns

| Old | New |
|-----|-----|
| `console.log(...)` | `logger.info(...)` |
| `console.info(...)` | `logger.info(...)` |
| `console.warn(...)` | `logger.warn(...)` |
| `console.error(...)` | `logger.error(...)` |
| `console.debug(...)` | `logger.debug(...)` |

### Context Prefixes

Add context prefixes to make logs easier to filter:

```javascript
// Before
console.log('Plan created successfully');

// After
logger.info('[Supabase] Plan created successfully');
logger.info('[Dashboard] Loading user data');
logger.info('[Auth] User signed in');
logger.error('[Admin] Cleanup failed:', error);
```

## Files to Update

### High Priority (Core Logic)

1. **src/lib/supabase.js** - Database operations
   - Pattern: `[Supabase]` prefix
   - Replace ~15 console.log statements

2. **src/lib/dataService.js** - Data layer
   - Pattern: `[DataService]` prefix
   - Replace ~10 console.log statements

3. **src/pages/DashboardPage.jsx** - Main dashboard
   - Pattern: `[Dashboard]` prefix
   - Replace ~8 console.log statements

4. **src/pages/AdminPage.jsx** - Admin panel
   - Pattern: `[Admin]` prefix
   - Replace ~5 console.error statements
   - ✅ Logger import added

5. **src/contexts/AuthContext.jsx** - Authentication
   - Pattern: `[Auth]` prefix
   - Replace ~6 console.log statements

### Medium Priority

6. **src/lib/planGenerator.js** - Plan generation
   - Pattern: `[PlanGen]` prefix

7. **src/lib/llmPlanGenerator.js** - LLM integration
   - Pattern: `[LLM]` prefix

8. **src/pages/IntakePage.jsx** - Intake form
   - Pattern: `[Intake]` prefix

9. **src/pages/GeneratingPage.jsx** - Loading page
   - Pattern: `[Generating]` prefix

### Low Priority

10. **src/lib/planBuilder.js** - Plan building logic
11. **src/lib/testPlanBuilder.js** - Test utilities

## Step-by-Step Migration

### For Each File:

1. **Add Import**
   ```javascript
   import logger from '../lib/logger';
   ```

2. **Replace console statements**
   - Use find & replace (Cmd/Ctrl + H)
   - Search: `console.log(`
   - Replace: `logger.info(`
   - Review each replacement manually

3. **Add Context Prefixes**
   ```javascript
   // Add meaningful prefixes
   logger.info('[ComponentName] Message here');
   ```

4. **Test the file**
   - Ensure no errors
   - Check that logs appear in Admin > Logs tab

## Example Migration

### Before (supabase.js)
```javascript
export async function savePlanToSupabase(plan, userId) {
  console.log('[Supabase] Saving plan for user:', userId);
  
  try {
    const { data, error } = await supabase.from('plans').insert(plan);
    if (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
    console.log('[Supabase] Plan saved successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Failed to save plan:', error);
    throw error;
  }
}
```

### After (supabase.js)
```javascript
import logger from './logger';

export async function savePlanToSupabase(plan, userId) {
  logger.info('[Supabase] Saving plan for user:', userId);
  
  try {
    const { data, error } = await supabase.from('plans').insert(plan);
    if (error) {
      logger.error('[Supabase] Error saving plan:', error);
      throw error;
    }
    logger.info('[Supabase] Plan saved successfully:', data.id);
    return data;
  } catch (error) {
    logger.error('[Supabase] Failed to save plan:', error);
    throw error;
  }
}
```

## Verification

After migration, verify:

1. **No console.log statements remain**
   ```bash
   grep -r "console\.log" src/
   ```

2. **Logs appear in Admin panel**
   - Navigate to Admin > Logs tab
   - Perform actions (create plan, load dashboard, etc.)
   - Verify logs are captured

3. **Production behavior**
   - Set `VITE_LOG_LEVEL=ERROR` in .env.production
   - Build and test
   - Only errors should appear in console

## Environment Configuration

### Development (.env.development)
```bash
VITE_LOG_LEVEL=INFO  # or DEBUG for verbose
```

### Production (.env.production)
```bash
VITE_LOG_LEVEL=ERROR  # Only log errors
```

### Available Levels
- `DEBUG` - Most verbose, all logs
- `INFO` - General information (default in dev)
- `WARN` - Warnings only
- `ERROR` - Errors only (default in prod)
- `NONE` - No logs

## Benefits

✅ **Centralized logging** - All logs in one place  
✅ **Environment-aware** - Auto-adjusts for dev/prod  
✅ **Admin visibility** - View logs in real-time  
✅ **Export capability** - Download logs as JSON/CSV  
✅ **Filterable** - Search and filter by level  
✅ **Production-safe** - No verbose logs in production  

## Automated Migration Script

For bulk replacement, you can use this regex find & replace:

**VS Code / Cursor:**
1. Open Find & Replace (Cmd/Ctrl + Shift + H)
2. Enable regex mode
3. Find: `console\.(log|info|warn|error|debug)\(`
4. Replace: `logger.$1(`
5. Review each match before replacing

**Important:** Always review replacements manually to ensure context prefixes are added!

---

**Status:** Logger utility created ✅  
**Admin viewer:** Added ✅  
**Migration:** In progress (AdminPage done)  
**Next:** Migrate supabase.js, dataService.js, DashboardPage.jsx
