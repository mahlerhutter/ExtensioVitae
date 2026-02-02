import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Dashboard Header Component
 * Top navigation bar with branding and user actions
 */
export default function DashboardHeader({ userName, onSignOut, onProfileClick, isAdmin }) {
    return (
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <a href="/" className="text-xl font-semibold text-white tracking-tight">
                    Extensio<span className="text-amber-400">Vitae</span>
                </a>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="text-amber-400 hover:text-amber-300 text-sm transition-colors flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-400/20"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Admin</span>
                        </Link>
                    )}
                    <button
                        onClick={onProfileClick}
                        className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 hover:bg-slate-800 px-2 py-1 rounded"
                    >
                        {userName}
                    </button>
                    <button
                        onClick={onSignOut}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                    >
                        <span>Sign Out</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
