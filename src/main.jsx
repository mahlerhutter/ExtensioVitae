import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { initAnalytics } from './lib/analytics';
import './index.css';

import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// TODO: Sentry integration ready - install @sentry/react and uncomment
// See docs/SENTRY_SETUP.md for instructions

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
