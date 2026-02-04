# Sentry Error Monitoring Setup Guide

**Date:** 2026-02-04  
**Priority:** 🟠 HIGH  
**Effort:** 2-3 hours  
**Cost:** FREE (up to 5,000 errors/month)

---

## 🎯 Why Sentry?

**Benefits:**
- Real-time error tracking
- Performance monitoring
- Release tracking
- User feedback
- Source map support
- Free tier: 5,000 errors/month

---

## 📋 Setup Steps

### Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with email or GitHub
3. Choose "React" as your platform
4. Create a new project: "ExtensioVitae"
5. Copy your DSN (Data Source Name)

**DSN Format:**
```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

### Step 2: Install Sentry SDK

```bash
cd /Users/mahlerhutter/dev/playground/MVPExtensio
npm install @sentry/react
```

### Step 3: Add DSN to Environment Variables

**File:** `.env.local`

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=production
```

**For development:**
```bash
# .env.development.local
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=development
```

### Step 4: Configure Sentry in Application

**File:** `src/main.jsx`

Add this BEFORE ReactDOM.createRoot:

```javascript
import * as Sentry from "@sentry/react";

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions (adjust in production)
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Release tracking
    release: `extensiovitae@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // Ignore common errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    // Before send hook (filter sensitive data)
    beforeSend(event, hint) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.error('Sentry Event (dev):', event, hint);
        return null;
      }
      
      // Filter out PII from event data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      return event;
    },
  });
}
```

### Step 5: Add Error Boundary

**File:** `src/components/ErrorBoundary.jsx` (create new file)

```javascript
import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    Sentry.captureException(error, { contexts: { react: errorInfo } });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-slate-400 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Wir wurden benachrichtigt und arbeiten an einer Lösung.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Step 6: Wrap App with Error Boundary

**File:** `src/main.jsx`

```javascript
import ErrorBoundary from './components/ErrorBoundary';

// ... Sentry init code ...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

### Step 7: Add Sentry to Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_SENTRY_DSN` = your DSN
   - `VITE_SENTRY_ENVIRONMENT` = `production`
5. Redeploy

### Step 8: Test Error Tracking

**Create a test error:**

```javascript
// In any component
<button onClick={() => {
  throw new Error('Test Sentry Error');
}}>
  Test Error
</button>
```

**Or use Sentry's test function:**

```javascript
import * as Sentry from '@sentry/react';

// Trigger test error
Sentry.captureException(new Error('Test Sentry Integration'));
```

---

## 🧪 Testing Checklist

- [ ] Sentry account created
- [ ] DSN added to `.env.local`
- [ ] Sentry SDK installed
- [ ] Sentry initialized in `main.jsx`
- [ ] ErrorBoundary component created
- [ ] App wrapped with ErrorBoundary
- [ ] Test error triggered
- [ ] Error appears in Sentry dashboard
- [ ] Environment variables added to Vercel
- [ ] Deployed to production
- [ ] Production error tracking verified

---

## 📊 Monitoring Best Practices

### 1. Set Up Alerts

**In Sentry Dashboard:**
1. Go to Alerts → Create Alert
2. Set conditions:
   - New issue created
   - Issue frequency > 10/hour
   - Error rate > 5%
3. Set notification channel (email, Slack)

### 2. Configure Release Tracking

**Add to package.json:**
```json
{
  "version": "1.0.0"
}
```

**In Sentry init:**
```javascript
release: `extensiovitae@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`
```

### 3. User Feedback

**Add user feedback widget:**
```javascript
import * as Sentry from '@sentry/react';

// When error occurs
Sentry.showReportDialog({
  eventId: errorEventId,
  title: 'Es ist ein Fehler aufgetreten',
  subtitle: 'Unser Team wurde benachrichtigt.',
  subtitle2: 'Möchten Sie uns mehr Details mitteilen?',
  labelName: 'Name',
  labelEmail: 'E-Mail',
  labelComments: 'Was ist passiert?',
  labelClose: 'Schließen',
  labelSubmit: 'Absenden',
  successMessage: 'Vielen Dank für Ihr Feedback!',
});
```

---

## 🔒 Privacy & Security

### Filter Sensitive Data

**Already configured in beforeSend:**
- Email addresses removed
- IP addresses removed
- PII filtered

### DSGVO Compliance

**Sentry settings:**
1. Go to Settings → Security & Privacy
2. Enable "Data Scrubbing"
3. Add sensitive fields:
   - password
   - token
   - secret
   - api_key
   - access_token

### Data Retention

**Free tier:**
- 30 days retention
- 5,000 errors/month

**Upgrade if needed:**
- Pro: $26/month, 50k errors
- Business: $80/month, 100k errors

---

## 📈 Performance Monitoring

**Already enabled with:**
```javascript
Sentry.browserTracingIntegration()
```

**Monitors:**
- Page load times
- API response times
- Component render times
- Navigation performance

**View in Sentry:**
- Go to Performance tab
- See transaction traces
- Identify slow operations

---

## 🐛 Common Issues

### Issue: "Sentry is not defined"

**Solution:**
```javascript
import * as Sentry from '@sentry/react';
```

### Issue: Errors not appearing in Sentry

**Checklist:**
- [ ] DSN is correct
- [ ] Environment variable set
- [ ] Sentry.init() called before app render
- [ ] Not in development mode (beforeSend returns null)
- [ ] Network connection working

### Issue: Too many errors

**Solution:**
1. Add to ignoreErrors array
2. Adjust sample rate
3. Filter in beforeSend

---

## ✅ Success Criteria

- [ ] Errors tracked in real-time
- [ ] Email alerts configured
- [ ] Performance monitoring active
- [ ] User feedback widget working
- [ ] PII filtered correctly
- [ ] Release tracking enabled
- [ ] Production deployment verified

---

## 📝 Next Steps After Setup

1. **Monitor for 1 week**
   - Review errors daily
   - Fix critical issues
   - Adjust alert thresholds

2. **Optimize sample rates**
   - Reduce tracesSampleRate if needed
   - Adjust replay sample rates

3. **Set up integrations**
   - Slack notifications
   - GitHub issue creation
   - Jira integration (if needed)

---

**Status:** 📋 READY TO IMPLEMENT  
**Time Required:** 2-3 hours  
**Impact:** CRITICAL for production monitoring

**Last Updated:** 2026-02-04  
**Owner:** ExtensioVitae DevOps
