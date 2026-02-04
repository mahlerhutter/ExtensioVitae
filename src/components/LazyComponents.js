/**
 * Lazy Loading Components
 *
 * Code-splitting setup for heavy components to improve initial load time.
 */

import React, { lazy, Suspense } from 'react';
import { LoadingFallback } from './common/ErrorBoundary';

// Lazy-loaded components
export const LazyProgressDashboard = lazy(() =>
  import('./analytics/ProgressDashboard')
);

export const LazyBloodCheckPanel = lazy(() =>
  import('./bloodcheck/BloodCheckPanel')
);

export const LazyNotificationSettings = lazy(() =>
  import('./notifications/NotificationSettings')
);

export const LazyModuleHub = lazy(() =>
  import('./modules/ModuleHub')
);

export const LazyModuleActivationFlow = lazy(() =>
  import('./modules/ModuleActivationFlow')
);

/**
 * Wrapped lazy component with Suspense
 */
export function withSuspense(Component, fallbackMessage) {
  return function SuspenseWrapper(props) {
    return (
      <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped lazy components with Suspense
export const ProgressDashboard = withSuspense(LazyProgressDashboard);
export const BloodCheckPanel = withSuspense(LazyBloodCheckPanel);
export const NotificationSettings = withSuspense(LazyNotificationSettings);
export const ModuleHub = withSuspense(LazyModuleHub);
export const ModuleActivationFlow = withSuspense(LazyModuleActivationFlow);
