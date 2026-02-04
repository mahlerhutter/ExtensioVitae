import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Calendar OAuth Callback Page
 * Handles the OAuth redirect from Google
 */
export default function CalendarCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        // Send message to parent window (popup opener)
        if (window.opener) {
            window.opener.postMessage(
                { code, error },
                window.location.origin
            );

            // Close popup
            window.close();
        } else {
            // If not in popup, redirect to dashboard
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
                <p className="text-slate-400">Connecting calendar...</p>
            </div>
        </div>
    );
}
