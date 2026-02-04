import React, { Component } from 'react';

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // Could send to error tracking service here
    // e.g., Sentry, LogRocket, etc.
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children, language = 'de' } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error, retry: this.handleRetry })
          : fallback;
      }

      // Default fallback UI
      return (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-white font-medium mb-2">
            {language === 'de' ? 'Etwas ist schiefgelaufen' : 'Something went wrong'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {language === 'de'
              ? 'Ein unerwarteter Fehler ist aufgetreten.'
              : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm transition-colors"
          >
            {language === 'de' ? 'Erneut versuchen' : 'Try Again'}
          </button>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-slate-500 cursor-pointer">
                {language === 'de' ? 'Fehlerdetails' : 'Error Details'}
              </summary>
              <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-400 overflow-auto">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

/**
 * Suspense fallback component for lazy loading
 */
export function LoadingFallback({ message, language = 'de' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 text-sm">
        {message || (language === 'de' ? 'Wird geladen...' : 'Loading...')}
      </p>
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ icon = '📭', title, description, action, language = 'de' }) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-white font-medium mb-1">
        {title || (language === 'de' ? 'Keine Daten' : 'No Data')}
      </h3>
      {description && (
        <p className="text-sm text-slate-400 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
