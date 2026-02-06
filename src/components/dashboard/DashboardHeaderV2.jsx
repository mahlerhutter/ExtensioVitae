import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, ChevronDown } from 'lucide-react';

/**
 * Dashboard Header V2 - Dual Menu Design
 *
 * Two separate menus:
 * 1. "You" - User profile data
 * 2. "Health" - Health data & features
 */
export default function DashboardHeaderV2({ userName, onSignOut, onProfileClick, isAdmin }) {
    const [openMenu, setOpenMenu] = useState(null); // 'you' | 'health' | null
    const youMenuRef = useRef(null);
    const healthMenuRef = useRef(null);
    const navigate = useNavigate();

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                youMenuRef.current && !youMenuRef.current.contains(event.target) &&
                healthMenuRef.current && !healthMenuRef.current.contains(event.target)
            ) {
                setOpenMenu(null);
            }
        };

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenu]);

    const handleMenuItemClick = (action) => {
        setOpenMenu(null);
        if (action) action();
    };

    return (
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/dashboard" className="text-xl font-semibold text-white tracking-tight">
                    Extensio<span className="text-amber-400">Vitae</span>
                </Link>

                <div className="flex items-center gap-3">
                    {/* Longevity Store */}
                    <Link
                        to="/shop"
                        className="text-amber-400 hover:text-amber-300 text-sm transition-colors flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-400/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="hidden sm:inline">Store</span>
                    </Link>

                    {/* Admin Link */}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="text-slate-400 hover:text-white text-sm px-2"
                        >
                            Admin
                        </Link>
                    )}

                    {/* MENU 1: "You" (User Data) */}
                    <div className="relative" ref={youMenuRef}>
                        <button
                            onClick={() => setOpenMenu(openMenu === 'you' ? null : 'you')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-white hidden sm:inline">You</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenu === 'you' ? 'rotate-180' : ''}`} />
                        </button>

                        {openMenu === 'you' && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-slate-700">
                                    <p className="text-sm font-medium text-white">{userName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Dein Account</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/dashboard'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span>Startseite</span>
                                    </button>

                                    <button
                                        onClick={() => handleMenuItemClick(onProfileClick)}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Profil bearbeiten</span>
                                    </button>

                                    <div className="border-t border-slate-700 mt-1 pt-1">
                                        <button
                                            onClick={() => handleMenuItemClick(onSignOut)}
                                            className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-3 transition-colors text-left"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Abmelden</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MENU 2: "Health" (Health Data) */}
                    <div className="relative" ref={healthMenuRef}>
                        <button
                            onClick={() => setOpenMenu(openMenu === 'health' ? null : 'health')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Heart className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-white hidden sm:inline">Health</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenu === 'health' ? 'rotate-180' : ''}`} />
                        </button>

                        {openMenu === 'health' && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-slate-700">
                                    <p className="text-sm font-medium text-white">Gesundheitsdaten</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Tracking & Insights</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/health-profile'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <span>🩺</span>
                                        <span>Gesundheitsprofil</span>
                                    </button>

                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/labs'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <span>🧪</span>
                                        <span>Laborberichte</span>
                                    </button>

                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/recovery'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <span>📊</span>
                                        <span>Recovery & Performance</span>
                                    </button>

                                    <button
                                        onClick={() => handleMenuItemClick(() => navigate('/modules'))}
                                        className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors text-left"
                                    >
                                        <span>🧩</span>
                                        <span>Module Hub</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Avatar (Visual Indicator) */}
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-slate-900 font-semibold text-sm ml-1">
                        {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
