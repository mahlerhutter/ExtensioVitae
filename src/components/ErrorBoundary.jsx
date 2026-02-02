import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                />
            );
        }

        return this.props.children;
    }
}

// Fallback UI Component
function ErrorFallback({ error, errorInfo, resetError }) {
    const navigate = useNavigate();

    const handleReload = () => {
        resetError();
        window.location.reload();
    };

    const handleGoToIntake = () => {
        resetError();
        navigate('/intake');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Error Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-3">
                        Oops! Etwas ist schiefgelaufen
                    </h1>

                    {/* Description */}
                    <p className="text-slate-400 text-center mb-8">
                        Beim Laden des Dashboards ist ein unerwarteter Fehler aufgetreten.
                        Bitte versuche es erneut oder erstelle einen neuen Plan.
                    </p>

                    {/* Error Details (Collapsible) */}
                    {error && (
                        <details className="mb-8 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                            <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                                Technische Details anzeigen
                            </summary>
                            <div className="mt-4 space-y-2">
                                <div className="text-xs text-red-400 font-mono bg-slate-950 p-3 rounded border border-red-500/20 overflow-x-auto">
                                    {error.toString()}
                                </div>
                                {errorInfo && (
                                    <div className="text-xs text-slate-500 font-mono bg-slate-950 p-3 rounded border border-slate-700 overflow-x-auto max-h-40 overflow-y-auto">
                                        {errorInfo.componentStack}
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleReload}
                            className="flex-1 py-3 px-6 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Seite neu laden
                        </button>

                        <button
                            onClick={handleGoToIntake}
                            className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all border border-slate-700 flex items-center justify-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Neuen Plan erstellen
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="text-sm text-slate-500 text-center">
                            Wenn das Problem weiterhin besteht, kontaktiere uns unter{' '}
                            <a
                                href="mailto:hello@extensiovitae.com"
                                className="text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                hello@extensiovitae.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ErrorBoundary;
