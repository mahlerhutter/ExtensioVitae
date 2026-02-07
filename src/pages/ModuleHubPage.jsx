/**
 * Module Hub Page
 *
 * Dedicated page for exploring and activating longevity modules.
 * Special handling for yearly-optimization with rich preview.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getUserModules, activateModule, getAvailableModules } from '../lib/moduleService';
import { getActivePlanFromSupabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ModulePreview from '../components/marketplace/ModulePreview';

export default function ModuleHubPage() {
    useDocumentTitle('Module Hub - ExtensioVitae');

    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [activeModules, setActiveModules] = useState([]);
    const [hasActivePlan, setHasActivePlan] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    // ─── Preview State ───
    const [previewModule, setPreviewModule] = useState(null);

    useEffect(() => {
        loadModules();
    }, [user?.id]);

    const loadModules = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [allModules, userModules, activePlan] = await Promise.all([
                getAvailableModules(),
                getUserModules(user.id),
                getActivePlanFromSupabase(user.id)
            ]);

            setModules(allModules || []);
            setActiveModules(userModules || []);
            setHasActivePlan(!!activePlan);
        } catch (error) {
            logger.error('[ModuleHub] Failed to load modules:', error);
            addToast('Fehler beim Laden der Module', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ─── Activation Handler (now receives config from preview) ───
    const handleActivate = async (module, config = {}) => {
        if (!user?.id) {
            addToast('Bitte anmelden, um Module zu aktivieren', 'error');
            navigate('/auth');
            return;
        }

        setActivating(module.id || module.slug);

        try {
            const result = await activateModule(user.id, module.slug, config);

            if (result.success) {
                addToast(`✨ ${module.name_de} aktiviert!`, 'success');
                setPreviewModule(null);
                loadModules(); // Refresh
            } else {
                throw new Error(result.error || 'Activation failed');
            }
        } catch (error) {
            logger.error('[ModuleHub] Failed to activate:', error);
            addToast(error.message || 'Fehler beim Aktivieren', 'error');
        } finally {
            setActivating(null);
        }
    };

    // ─── Card Click Handler ───
    // Modules with config_schema or yearly-optimization → show preview
    // Simple modules → activate directly
    const handleCardClick = (module) => {
        const hasConfig = module.config_schema?.fields?.length > 0;
        const isYearly = module.slug === 'yearly-optimization';

        if (hasConfig || isYearly) {
            setPreviewModule(module);
        } else {
            handleActivate(module);
        }
    };

    // Group modules by category
    const categories = {
        all: { label: 'Alle Module', icon: '🌟' },
        nutrition: { label: 'Ernährung', icon: '🥗' },
        exercise: { label: 'Bewegung', icon: '🏃' },
        sleep: { label: 'Schlaf', icon: '😴' },
        supplements: { label: 'Supplements', icon: '💊' },
        mindset: { label: 'Psyche & Mindset', icon: '🧠' },
        health: { label: 'Gesundheit', icon: '🩺' }
    };

    const filteredModules = selectedCategory === 'all'
        ? modules
        : modules.filter(m => m.category === selectedCategory);

    const isModuleActive = (moduleId) => {
        return activeModules.some(am => am.module_id === moduleId && am.status === 'active');
    };

    // ═══════════════════════════════════════
    // PREVIEW MODE: Full-screen module preview
    // ═══════════════════════════════════════
    if (previewModule) {
        return (
            <div className="min-h-screen bg-slate-950">
                <DashboardHeader
                    userName={user?.email?.split('@')[0]}
                    onSignOut={() => navigate('/dashboard')}
                    onProfileClick={() => navigate('/dashboard')}
                />
                <main className="max-w-3xl mx-auto px-4 py-6" style={{ height: 'calc(100vh - 64px)' }}>
                    <ModulePreview
                        module={previewModule}
                        userId={user?.id}
                        language="de"
                        onActivate={(config) => handleActivate(previewModule, config)}
                        onBack={() => setPreviewModule(null)}
                    />
                </main>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // DEFAULT: Module Grid
    // ═══════════════════════════════════════
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Lade Module...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader
                userName={user?.email?.split('@')[0]}
                onSignOut={() => navigate('/dashboard')}
                onProfileClick={() => navigate('/dashboard')}
            />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium mb-4 flex items-center gap-2"
                    >
                        ← Zurück zum Dashboard
                    </button>

                    <h1 className="text-3xl font-bold text-white mb-2">
                        Longevity Module Hub
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Aktiviere evidenz-basierte Module für kontinuierliches Tracking & Optimierung
                    </p>
                </div>

                {/* Category Filter */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {Object.entries(categories).map(([key, cat]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${selectedCategory === key
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span className="mr-2">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Modules Grid */}
                {filteredModules.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Keine Module in dieser Kategorie</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredModules.map(module => (
                            <ModuleCard
                                key={module.id || module.slug}
                                module={module}
                                isActive={isModuleActive(module.id)}
                                isConflict={hasActivePlan && module.slug === 'longevity-kickstart'}
                                conflictMessage="Bereits durch Hauptplan abgedeckt"
                                isActivating={activating === module.id || activating === module.slug}
                                onActivate={() => handleCardClick(module)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/**
 * Module Card Component
 */
function ModuleCard({ module, isActive, isConflict, conflictMessage, isActivating, onActivate }) {
    const [expanded, setExpanded] = useState(false);
    const isYearly = module.slug === 'yearly-optimization';

    const categoryColors = {
        nutrition: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        exercise: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
        sleep: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
        supplements: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        mindset: 'from-pink-500/20 to-purple-500/20 border-pink-500/30',
        health: 'from-red-500/20 to-orange-500/20 border-red-500/30',
        general: 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
    };

    const colorClass = isYearly
        ? 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
        : (categoryColors[module.category] || categoryColors.general);

    return (
        <div className={`bg-gradient-to-br ${colorClass} border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all ${isYearly ? 'ring-1 ring-amber-500/20' : ''}`}>
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${isYearly ? 'bg-amber-500/10' : 'bg-slate-800/50'}`}>
                        {module.icon}
                    </div>
                    <div className="flex gap-2">
                        {isYearly && (
                            <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 uppercase">
                                Jahresprogramm
                            </span>
                        )}
                        {module.is_premium && (
                            <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 uppercase">
                                Premium
                            </span>
                        )}
                        {isActive && (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[10px] font-bold text-green-400 uppercase">
                                Aktiv
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                    {module.name_de}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    {module.description_de}
                </p>

                {/* Yearly teaser */}
                {isYearly && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-amber-400/80">
                        <span>18 Tasks</span>
                        <span>·</span>
                        <span>4 Quartale</span>
                        <span>·</span>
                        <span>0.7% deiner Zeit</span>
                    </div>
                )}
            </div>

            {/* Details Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="w-full px-6 py-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors flex items-center justify-between text-sm"
            >
                <span className="text-slate-400 font-medium">Details</span>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50 space-y-3 animate-in fade-in slide-in-from-top duration-300">
                    <DetailRow label="Typ" value={getTypeLabel(module.type)} />
                    {module.duration_days && (
                        <DetailRow label="Dauer" value={`${module.duration_days} Tage`} />
                    )}
                    {!module.duration_days && isYearly && (
                        <DetailRow label="Dauer" value="Kontinuierlich (365+ Tage)" />
                    )}
                    <DetailRow
                        label="Pillars"
                        value={
                            <div className="flex flex-wrap gap-1">
                                {(module.pillars || []).map(pillar => (
                                    <span
                                        key={pillar}
                                        className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-300"
                                    >
                                        {pillar}
                                    </span>
                                ))}
                            </div>
                        }
                    />
                </div>
            )}

            {/* Action Button */}
            <div className="p-6 pt-4">
                <button
                    onClick={onActivate}
                    disabled={isActive || isActivating || isConflict}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isActive || isConflict
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : isActivating
                            ? 'bg-amber-500/50 text-slate-900 cursor-wait'
                            : isYearly
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 shadow-lg shadow-amber-500/20'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/20'
                        }`}
                >
                    {isActivating ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            Aktiviere...
                        </span>
                    ) : isActive ? (
                        '✓ Bereits aktiviert'
                    ) : isConflict ? (
                        `✕ ${conflictMessage}`
                    ) : isYearly ? (
                        '📅 Vorschau & Aktivieren'
                    ) : (
                        'Modul aktivieren'
                    )}
                </button>
            </div>
        </div>
    );
}

/**
 * Detail Row Component
 */
function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-500 font-medium">{label}:</span>
            <span className="text-slate-300 text-right">{value}</span>
        </div>
    );
}

/**
 * Get type label
 */
function getTypeLabel(type) {
    const labels = {
        continuous: 'Kontinuierlich',
        recurring: 'Wiederkehrend',
        'one-time': 'Einmalig'
    };
    return labels[type] || type;
}
