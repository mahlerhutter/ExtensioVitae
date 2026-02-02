# Error Boundary Testing Guide

## Overview
The ErrorBoundary component catches React rendering errors in the DashboardPage and displays a user-friendly fallback UI instead of a blank page or crash.

## What It Catches

The ErrorBoundary will catch:
- ✅ Errors in component rendering
- ✅ Errors in lifecycle methods
- ✅ Errors in constructors
- ✅ Errors thrown during data transformation
- ✅ Undefined property access (e.g., `plan.days.map` when `plan` is null)

The ErrorBoundary will NOT catch:
- ❌ Errors in event handlers (use try-catch)
- ❌ Asynchronous errors (use try-catch in async functions)
- ❌ Server-side rendering errors
- ❌ Errors in the ErrorBoundary itself

## Testing the Error Boundary

### Method 1: Simulate an Error in Development

Add this temporary code to DashboardPage.jsx to trigger an error:

```javascript
// Add this inside the DashboardPage component, before the return statement
if (plan && plan.days && plan.days.length > 0) {
  // Uncomment to test error boundary:
  // throw new Error('Test error: Simulating a rendering crash');
}
```

### Method 2: Force a Null Reference Error

Temporarily remove a null check in the JSX:

```javascript
// Original (safe):
{plan?.days?.map(...)}

// Modified to trigger error:
{plan.days.map(...)}  // Will crash if plan is null
```

### Method 3: Use React DevTools

1. Open React DevTools
2. Find the DashboardPage component
3. Right-click → "Suspend this component"
4. This simulates a crash

## Expected Behavior

When an error occurs, users will see:

1. **Error Icon** - Red warning triangle
2. **Title** - "Oops! Etwas ist schiefgelaufen"
3. **Description** - Friendly explanation in German
4. **Technical Details** - Collapsible section with error stack trace
5. **Action Buttons:**
   - "Seite neu laden" (Reload) - Reloads the page
   - "Neuen Plan erstellen" (Create New Plan) - Navigates to /intake
6. **Support Contact** - Email link to hello@extensiovitae.com

## Visual Design

The fallback UI maintains the app's dark theme:
- Background: `bg-slate-950`
- Card: `bg-slate-900` with `border-slate-800`
- Primary button: Amber (matches brand)
- Secondary button: Slate (subtle)
- Error details: Red accent for visibility

## Production Considerations

### Error Logging

In production, you should send errors to a logging service:

```javascript
componentDidCatch(error, errorInfo) {
  // Log to your error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry, LogRocket, etc.
    logErrorToService(error, errorInfo);
  }
  
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  this.setState({ error, errorInfo });
}
```

### User Analytics

Track when errors occur:

```javascript
componentDidCatch(error, errorInfo) {
  // Track error event
  if (window.analytics) {
    window.analytics.track('Dashboard Error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
  }
}
```

## Common Errors This Will Catch

1. **Null Plan Data**
   - User's plan fails to load from Supabase
   - Plan data is corrupted or missing required fields

2. **Invalid JSON in plan_data**
   - Database contains malformed JSON
   - Migration issues cause data inconsistencies

3. **Missing Required Props**
   - Component receives undefined props
   - API response structure changes

4. **Type Errors**
   - Expecting array but receiving object
   - String operations on undefined values

## Recovery Options

Users have two clear paths to recover:

1. **Reload** - Often fixes transient issues (network, race conditions)
2. **Create New Plan** - Bypasses corrupted data by starting fresh

## Monitoring

To monitor error boundary activations in production:

```javascript
// In ErrorBoundary.jsx componentDidCatch:
const errorData = {
  message: error.toString(),
  stack: error.stack,
  componentStack: errorInfo.componentStack,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
};

// Send to your monitoring service
fetch('/api/log-error', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(errorData)
});
```

## Best Practices

1. **Don't Overuse** - Only wrap components where catastrophic failures are possible
2. **Provide Context** - Show users what went wrong and how to fix it
3. **Maintain Branding** - Keep the error UI consistent with your design
4. **Offer Escape Routes** - Always provide a way to recover or start over
5. **Log Everything** - Capture full error details for debugging

---

**Note:** The ErrorBoundary is now active on all DashboardPage routes. Test it thoroughly before deploying to production!
