// ExtensioVitae - OAuth Callback Handler for Wearables
// Handles OAuth callbacks from Oura, WHOOP, etc.

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback } from '../../services/wearableService';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get OAuth parameters
                const code = searchParams.get('code');
                const state = searchParams.get('state'); // Device type (oura, whoop, etc.)
                const error = searchParams.get('error');

                if (error) {
                    throw new Error(`OAuth error: ${error}`);
                }

                if (!code || !state) {
                    throw new Error('Missing OAuth parameters');
                }

                // Exchange code for tokens and save connection
                await handleOAuthCallback(state, code);

                setStatus('success');

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard?wearable_connected=true');
                }, 2000);
            } catch (err) {
                console.error('OAuth callback error:', err);
                setError(err.message);
                setStatus('error');

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/dashboard?wearable_error=true');
                }, 3000);
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    {status === 'processing' && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Connecting your device...
                            </h2>
                            <p className="text-white/70">
                                Please wait while we securely connect your wearable.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Successfully connected!
                            </h2>
                            <p className="text-white/70">
                                Redirecting you to the dashboard...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Connection failed
                            </h2>
                            <p className="text-white/70 mb-4">
                                {error || 'An error occurred while connecting your device.'}
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
