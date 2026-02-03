import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * NotFoundPage Component
 * Displays a 404 error page when users navigate to an undefined route
 */
export default function NotFoundPage() {
    useDocumentTitle('404 Not Found - ExtensioVitae');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse">
                        404
                    </h1>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Seite nicht gefunden
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Die Seite, die du suchst, existiert nicht oder wurde verschoben.
                        <br />
                        Vielleicht hast du dich vertippt?
                    </p>
                </div>

                {/* Illustration */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        {/* Animated circles */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-amber-400/20 animate-ping"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-4 border-amber-400/30 animate-pulse"></div>
                        </div>

                        {/* Icon */}
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg
                                className="w-20 h-20 text-amber-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 min-w-[200px] justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Zurück
                    </button>

                    <Link
                        to="/"
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-lg transition-colors flex items-center gap-2 min-w-[200px] justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Zur Startseite
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-slate-500 text-sm">
                        Brauchst du Hilfe?{' '}
                        <a
                            href="mailto:hello@extensiovitae.com"
                            className="text-amber-400 hover:text-amber-300 transition-colors underline"
                        >
                            Kontaktiere uns
                        </a>
                    </p>
                </div>

                {/* Quick Links */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
                    <Link to="/intake" className="text-slate-400 hover:text-amber-400 transition-colors">
                        Fragebogen starten
                    </Link>
                    <span className="text-slate-700">•</span>
                    <Link to="/dashboard" className="text-slate-400 hover:text-amber-400 transition-colors">
                        Dashboard
                    </Link>
                    <span className="text-slate-700">•</span>
                    <Link to="/admin" className="text-slate-400 hover:text-amber-400 transition-colors">
                        Admin
                    </Link>
                </div>
            </div>
        </div>
    );
}
