import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Dashboard Header Component
 * Top navigation bar with branding and expandable user menu
 */
export default function DashboardHeader({ userName, onSignOut, onProfileClick, isAdmin }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleMenuItemClick = (action) => {
        setIsMenuOpen(false);
        if (action) action();
    };

    return (
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/dashboard" className="text-xl font-semibold text-white tracking-tight">
                    Extensio<span className="text-amber-400">Vitae</span>
                </Link>

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

                    {/* User Menu Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 hover:bg-slate-800 px-3 py-2 rounded-lg"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-slate-900 font-semibold text-sm">
                                {userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="hidden sm:inline">{userName}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-slate-700">
                                    <p className="text-sm font-medium text-white">{userName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Dein Longevity Dashboard</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    {/* Startseite */}
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/dashboard'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span>Startseite</span>
                                    </button>

                                    {/* Profil bearbeiten */}
                                    <button
                                        onClick={() => handleMenuItemClick(onProfileClick)}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Profil bearbeiten</span>
                                    </button>

                                    {/* Gesundheitsprofil */}
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/health-profile'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>🩺 Gesundheitsprofil</span>
                                    </button>

                                    {/* Module Hub */}
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/modules'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <span>🧩 Module Hub</span>
                                    </button>

                                    {/* Lab Results */}
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/labs'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>🧪 Laborberichte</span>
                                    </button>

                                    {/* Divider */}
                                    <div className="border-t border-slate-700 my-1"></div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => handleMenuItemClick(onSignOut)}
                                        className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Abmelden</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
