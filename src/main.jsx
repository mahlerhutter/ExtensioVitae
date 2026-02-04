import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { initAnalytics } from './lib/analytics';
import './index.css';

import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

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
    tracesSampleRate: 1.0, // Capture 100% of transactions
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

// Initialize analytics (non-blocking)
initAnalytics().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
