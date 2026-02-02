import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../lib/supabase';
import LogViewer from '../components/LogViewer';
import logger from '../lib/logger';
import { getAllFeedback, getFeedbackStats, markFeedbackReviewed } from '../lib/feedbackService';

// Admin email whitelist from environment variable
// Format: VITE_ADMIN_EMAILS="email1@example.com,email2@example.com"
const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(email => email.trim()).filter(Boolean)
    : [];



export default function AdminPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPlans: 0,
        activePlans: 0,
        completedPlans: 0,
    });
    const [selectedTab, setSelectedTab] = useState('overview');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Feedback states
    const [feedback, setFeedback] = useState([]);
    const [feedbackStats, setFeedbackStats] = useState({
        total: 0,
        byType: {},
        avgRating: 0,
        unreviewed: 0,
    });
    const [feedbackFilter, setFeedbackFilter] = useState('all');


    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { user } = await getCurrentUser();

            if (!user) {
                navigate('/auth');
                return;
            }

            if (!ADMIN_EMAILS.includes(user.email)) {
                navigate('/dashboard');
                return;
            }

            setIsAdmin(true);
            await loadAdminData();
        } catch (error) {
            console.error('Admin check failed:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadAdminData = async () => {
        if (!supabase) return;

        try {
            // Fetch all user profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }
            setUsers(profilesData || []);

            // Fetch all plans (simple query, no join)
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (plansError) {
                console.error('Error fetching plans:', plansError);
            }
            setPlans(plansData || []);

            // Calculate stats
            const activePlans = (plansData || []).filter(p => p.status === 'active').length;
            const completedPlans = (plansData || []).filter(p => p.status === 'completed').length;

            setStats({
                totalUsers: profilesData?.length || 0,
                totalPlans: plansData?.length || 0,
                activePlans,
                completedPlans,
            });

            // Load feedback data
            const feedbackData = await getAllFeedback();
            setFeedback(feedbackData);

            const stats = await getFeedbackStats();
            setFeedbackStats(stats);

        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!supabase) return;

        setDeleteLoading(true);
        try {
            // First delete related daily_progress records
            await supabase
                .from('daily_progress')
                .delete()
                .eq('plan_id', planId);

            // Then delete the plan
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            // Refresh data
            await loadAdminData();
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete plan:', error);
            alert('Fehler beim Löschen: ' + error.message);
        } finally {
            setDeleteLoading(false);
        }
    };



    const cleanupActivePlans = async () => {
        if (!supabase) return;
        if (!window.confirm('WARNUNG: Nur den NEUESTEN Plan jedes Users auf "active" setzen? Alle anderen werden "inactive".')) return;

        setLoading(true);
        try {
            // 1. Fetch fresh data first to ensure we work on latest state
            const { data: currentPlans, error: fetchError } = await supabase
                .from('plans')
                .select('*');

            if (fetchError) throw fetchError;

            // Group plans by user
            const userPlans = {};
            currentPlans.forEach(plan => {
                if (!userPlans[plan.user_id]) {
                    userPlans[plan.user_id] = [];
                }
                userPlans[plan.user_id].push(plan);
            });

            let updatesCount = 0;
            let usersAffected = 0;

            for (const userId of Object.keys(userPlans)) {
                // Sort plans by created_at OR generated_at desc
                // Fallback to ID desc if timestamps match
                const sorted = userPlans[userId].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.generated_at || 0).getTime();
                    const dateB = new Date(b.created_at || b.generated_at || 0).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b.id || '').localeCompare(a.id || '');
                });

                const latest = sorted[0];
                const others = sorted.slice(1);

                let userHadUpdates = false;

                // 1. Make sure latest is active
                if (latest.status !== 'active') {
                    const { error } = await supabase.from('plans').update({ status: 'active' }).eq('id', latest.id);
                    if (error) {
                        console.error(`Failed to activate plan ${latest.id}`, error);
                    } else {
                        updatesCount++;
                        userHadUpdates = true;
                    }
                }

                // 2. Make sure all others are inactive
                for (const oldPlan of others) {
                    if (oldPlan.status !== 'inactive') {
                        const { error } = await supabase.from('plans').update({ status: 'inactive' }).eq('id', oldPlan.id);
                        if (error) {
                            console.error(`Failed to deactivate plan ${oldPlan.id}`, error);
                        } else {
                            updatesCount++;
                            userHadUpdates = true;
                        }
                    }
                }

                if (userHadUpdates) usersAffected++;
            }

            // Reload data to reflect changes
            await loadAdminData();

            if (updatesCount > 0) {
                alert(`Cleanup erfolgreich! ${updatesCount} Änderungen bei ${usersAffected} Usern durchgeführt.`);
            } else {
                alert('Keine Änderungen erforderlich. Alle Daten sind bereits sauber.');
            }

        } catch (error) {
            console.error('Cleanup failed:', error);
            alert('Cleanup fehlgeschlagen: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
            paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        return styles[status] || styles.pending;
    };

    // Detail Modal Component
    const PlanDetailModal = ({ plan, onClose }) => {
        if (!plan) return null;

        const planData = plan.plan_data || {};
        const days = planData.days || [];

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                        <div>
                            <h2 className="text-xl font-bold text-white">Plan Details</h2>
                            <p className="text-slate-400 text-sm">{plan.user_name} • {formatDate(plan.created_at)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Summary Section */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Plan Info</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">ID:</span>
                                            <span className="text-white font-mono text-xs">{plan.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Status:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Methode:</span>
                                            <span className="text-amber-400">{plan.generation_method}</span>
                                        </div>
                                        {plan.llm_provider && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">LLM Provider:</span>
                                                <span className="text-white">{plan.llm_provider}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Aktueller Tag:</span>
                                            <span className="text-white">{plan.current_day} / 30</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Start:</span>
                                            <span className="text-white">{formatDate(plan.start_date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Fokus-Bereiche</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(plan.primary_focus_pillars || []).map((pillar, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm border border-amber-500/30">
                                                {pillar}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">Zusammenfassung</h3>
                                    <p className="text-slate-300 text-sm">{plan.plan_summary || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* 30-Day Tasks */}
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">30-Tage Plan</h3>
                            <div className="grid gap-3 md:grid-cols-2">
                                {days.slice(0, 10).map((day, i) => (
                                    <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-amber-400 font-semibold">Tag {day.day}</span>
                                            <span className="text-slate-500 text-xs">{day.tasks?.length || 0} Aufgaben</span>
                                        </div>
                                        <div className="space-y-1">
                                            {(day.tasks || []).slice(0, 3).map((task, j) => (
                                                <div key={j} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-slate-500">•</span>
                                                    <span className="truncate">{task.description || task.title || 'Aufgabe'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {days.length > 10 && (
                                <p className="text-center text-slate-500 mt-4">... und {days.length - 10} weitere Tage</p>
                            )}
                            {days.length === 0 && (
                                <p className="text-center text-slate-500 py-8">Keine Tagesaufgaben verfügbar</p>
                            )}
                        </div>

                        {/* Raw JSON Section */}
                        <div className="p-6 border-t border-slate-800">
                            <details className="group">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-400 uppercase tracking-wider hover:text-white transition-colors">
                                    📄 Raw JSON anzeigen
                                </summary>
                                <pre className="mt-4 bg-slate-950 rounded-lg p-4 overflow-x-auto text-xs text-slate-400 font-mono max-h-64 overflow-y-auto">
                                    {JSON.stringify(plan, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-between items-center">
                        <button
                            onClick={() => {
                                setSelectedPlan(null);
                                setShowDeleteConfirm(plan.id);
                            }}
                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-sm transition-colors"
                        >
                            🗑️ Plan löschen
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Delete Confirmation Modal
    const DeleteConfirmModal = ({ planId, onConfirm, onCancel }) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return null;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
                <div
                    className="bg-slate-900 border border-red-500/30 rounded-xl max-w-md w-full p-6 shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Plan löschen?</h2>
                        <p className="text-slate-400 mb-2">
                            Möchtest du den Plan von <span className="text-white font-semibold">{plan.user_name}</span> wirklich löschen?
                        </p>
                        <p className="text-red-400 text-sm mb-6">
                            Diese Aktion kann nicht rückgängig gemacht werden!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                disabled={deleteLoading}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={() => onConfirm(planId)}
                                className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Löschen...
                                    </>
                                ) : (
                                    '🗑️ Löschen'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Lade Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Modals */}
            {selectedPlan && (
                <PlanDetailModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
            )}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    planId={showDeleteConfirm}
                    onConfirm={handleDeletePlan}
                    onCancel={() => setShowDeleteConfirm(null)}
                />
            )}

            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="text-xl font-semibold text-white tracking-tight">
                            Extensio<span className="text-amber-400">Vitae</span>
                        </a>
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider border border-red-500/30">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            ← Zurück zum Dashboard
                        </button>

                        <button
                            onClick={cleanupActivePlans}
                            className="text-emerald-500/50 hover:text-emerald-400 text-xs px-2"
                            title="Cleanup: Only latest plan active"
                        >
                            🧹
                        </button>
                        <button
                            onClick={loadAdminData}
                            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                        >
                            🔄 Aktualisieren
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
                        <div className="text-slate-400 text-sm">Registrierte User</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-white mb-1">{stats.totalPlans}</div>
                        <div className="text-slate-400 text-sm">Erstellte Pläne</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.activePlans}</div>
                        <div className="text-slate-400 text-sm">Aktive Pläne</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="text-3xl font-bold text-blue-400 mb-1">{stats.completedPlans}</div>
                        <div className="text-slate-400 text-sm">Abgeschlossene Pläne</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'overview'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        📊 Übersicht
                    </button>
                    <button
                        onClick={() => setSelectedTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'users'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        👥 User ({stats.totalUsers})
                    </button>
                    <button
                        onClick={() => setSelectedTab('plans')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'plans'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        📋 Pläne ({stats.totalPlans})
                    </button>
                    <button
                        onClick={() => setSelectedTab('logs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'logs'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        📝 Logs
                    </button>
                    <button
                        onClick={() => setSelectedTab('seo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'seo'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        🔍 SEO
                    </button>
                    <button
                        onClick={() => setSelectedTab('feedback')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'feedback'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        💬 Feedback ({feedbackStats.unreviewed})
                    </button>
                </div>

                {/* Tab Content */}
                {selectedTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recent Users */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800">
                                <h3 className="text-lg font-semibold text-white">Neueste User</h3>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {users.slice(0, 5).map((user) => (
                                    <div key={user.id} className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium truncate">{user.name || 'Unbekannt'}</div>
                                            <div className="text-slate-400 text-sm truncate">{user.email}</div>
                                        </div>
                                        <div className="text-slate-500 text-xs text-right">
                                            {formatDate(user.created_at)}
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="px-6 py-8 text-center text-slate-500">
                                        Noch keine User registriert
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Plans */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800">
                                <h3 className="text-lg font-semibold text-white">Neueste Pläne</h3>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {plans.slice(0, 5).map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="px-6 py-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
                                        onClick={() => setSelectedPlan(plan)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-white font-medium">{plan.user_name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                                                    {plan.status}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDeleteConfirm(plan.id);
                                                    }}
                                                    className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 text-sm transition-colors"
                                                    title="Löschen"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="text-slate-400 flex items-center gap-2">
                                                <span className="text-amber-400">{plan.generation_method}</span>
                                                {plan.llm_provider && (
                                                    <span className="text-slate-500">• {plan.llm_provider}</span>
                                                )}
                                            </div>
                                            <div className="text-slate-500 text-xs">
                                                {formatDate(plan.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {plans.length === 0 && (
                                    <div className="px-6 py-8 text-center text-slate-500">
                                        Noch keine Pläne erstellt
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {selectedTab === 'users' && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Sprache</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Registriert</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="text-white font-medium">{user.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                        <td className="px-6 py-4 text-slate-400">{user.language || 'de'}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(user.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="px-6 py-12 text-center text-slate-500">
                                Noch keine User registriert
                            </div>
                        )}
                    </div>
                )}

                {selectedTab === 'plans' && (
                    <div className="space-y-8">
                        {/* Active Plans Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white">
                                    Aktive Pläne
                                    <span className="ml-2 text-sm font-normal text-slate-400">
                                        ({plans.filter(p => p.status === 'active').length})
                                    </span>
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fokus</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Methode</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Erstellt</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {plans.filter(p => p.status === 'active').map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{plan.user_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(plan.primary_focus_pillars || []).slice(0, 3).map((pillar, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                                                            {pillar}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-amber-400 text-sm">{plan.generation_method}</div>
                                                {plan.llm_provider && (
                                                    <div className="text-slate-500 text-xs">{plan.llm_provider}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                                                    {plan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${(plan.current_day / 30) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-slate-400 text-sm">{plan.current_day}/30</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(plan.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPlan(plan)}
                                                        className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors"
                                                    >
                                                        📋 Details
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(plan.id)}
                                                        className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {plans.filter(p => p.status === 'active').length === 0 && (
                                <div className="px-6 py-12 text-center text-slate-500">
                                    Keine aktiven Pläne gefunden
                                </div>
                            )}
                        </div>

                        {/* Inactive / Archived Plans Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden opacity-80">
                            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    Inaktive / Vergangene Pläne
                                    <span className="ml-2 text-sm font-normal text-slate-500">
                                        ({plans.filter(p => p.status !== 'active').length})
                                    </span>
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fokus</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Methode</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Erstellt</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {plans.filter(p => p.status !== 'active').map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-slate-300 font-medium">{plan.user_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(plan.primary_focus_pillars || []).slice(0, 3).map((pillar, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-xs">
                                                            {pillar}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-400 text-sm">{plan.generation_method}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(plan.status)}`}>
                                                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(plan.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPlan(plan)}
                                                        className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
                                                    >
                                                        📋 Details
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(plan.id)}
                                                        className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {plans.filter(p => p.status !== 'active').length === 0 && (
                                <div className="px-6 py-12 text-center text-slate-500">
                                    Keine archivierten Pläne gefunden
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {selectedTab === 'logs' && (
                    <LogViewer />
                )}

                {/* SEO Tab */}
                {selectedTab === 'seo' && (
                    <div className="space-y-6">
                        {/* SEO Overview */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-amber-400 mb-4">🔍 SEO Übersicht</h2>

                            {/* Meta Tags Status */}
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-900 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-sm">Meta Tags</span>
                                        <span className="text-green-400 text-2xl">✓</span>
                                    </div>
                                    <p className="text-white font-semibold">Vollständig</p>
                                    <p className="text-slate-500 text-xs mt-1">Title, Description, Keywords</p>
                                </div>

                                <div className="bg-slate-900 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-sm">Open Graph</span>
                                        <span className="text-green-400 text-2xl">✓</span>
                                    </div>
                                    <p className="text-white font-semibold">Konfiguriert</p>
                                    <p className="text-slate-500 text-xs mt-1">Facebook, LinkedIn</p>
                                </div>

                                <div className="bg-slate-900 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 text-sm">Twitter Card</span>
                                        <span className="text-green-400 text-2xl">✓</span>
                                    </div>
                                    <p className="text-white font-semibold">Aktiv</p>
                                    <p className="text-slate-500 text-xs mt-1">Large Image Card</p>
                                </div>
                            </div>

                            {/* Current Meta Tags */}
                            <div className="bg-slate-900 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-semibold text-amber-400 mb-3">Aktuelle Meta Tags</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-slate-500">Title:</span>
                                        <p className="text-white">ExtensioVitae - Your 30-Day Longevity Blueprint</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Description:</span>
                                        <p className="text-white">Get a personalized, science-informed longevity plan delivered to your WhatsApp in under 3 minutes.</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Keywords:</span>
                                        <p className="text-white">longevity, health optimization, personalized health plan, wellness, WhatsApp coaching</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Canonical URL:</span>
                                        <p className="text-white">https://extensiovitae.com/</p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media Preview */}
                            <div className="bg-slate-900 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-amber-400 mb-3">Social Media Preview</h3>
                                <div className="border border-slate-700 rounded-lg overflow-hidden">
                                    <img
                                        src="/og-image.png"
                                        alt="Social Media Preview"
                                        className="w-full h-auto"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect fill="%230A1628" width="1200" height="630"/><text x="50%" y="50%" text-anchor="middle" fill="%23FBBF24" font-size="48">ExtensioVitae</text></svg>';
                                        }}
                                    />
                                    <div className="p-3 bg-slate-800">
                                        <p className="text-white font-semibold text-sm">ExtensioVitae - 30-Day Longevity Blueprint</p>
                                        <p className="text-slate-400 text-xs mt-1">extensiovitae.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEO Testing Tools */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-amber-400 mb-4">🧪 Testing Tools</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <a
                                    href="https://developers.facebook.com/tools/debug/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📘</span>
                                        <div>
                                            <p className="text-white font-semibold">Facebook Sharing Debugger</p>
                                            <p className="text-slate-400 text-xs">Test Open Graph tags</p>
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href="https://cards-dev.twitter.com/validator"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🐦</span>
                                        <div>
                                            <p className="text-white font-semibold">Twitter Card Validator</p>
                                            <p className="text-slate-400 text-xs">Test Twitter Card tags</p>
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href="https://www.linkedin.com/post-inspector/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">💼</span>
                                        <div>
                                            <p className="text-white font-semibold">LinkedIn Post Inspector</p>
                                            <p className="text-slate-400 text-xs">Test LinkedIn preview</p>
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href="https://search.google.com/test/rich-results"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🔍</span>
                                        <div>
                                            <p className="text-white font-semibold">Google Rich Results Test</p>
                                            <p className="text-slate-400 text-xs">Test structured data</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-amber-400 mb-4">⚡ Quick Actions</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => window.open('/robots.txt', '_blank')}
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🤖</span>
                                        <div>
                                            <p className="text-white font-semibold">View robots.txt</p>
                                            <p className="text-slate-400 text-xs">Check crawler rules</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => window.open('/manifest.json', '_blank')}
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📱</span>
                                        <div>
                                            <p className="text-white font-semibold">View PWA Manifest</p>
                                            <p className="text-slate-400 text-xs">Check app configuration</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        const url = window.location.origin;
                                        navigator.clipboard.writeText(url);
                                        alert('URL copied to clipboard!');
                                    }}
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📋</span>
                                        <div>
                                            <p className="text-white font-semibold">Copy Site URL</p>
                                            <p className="text-slate-400 text-xs">For testing tools</p>
                                        </div>
                                    </div>
                                </button>

                                <a
                                    href="/docs/FAVICON_SEO_IMPLEMENTATION.md"
                                    target="_blank"
                                    className="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 transition-colors block"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📚</span>
                                        <div>
                                            <p className="text-white font-semibold">SEO Documentation</p>
                                            <p className="text-slate-400 text-xs">View implementation guide</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* SEO Checklist */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-amber-400 mb-4">✅ SEO Checklist</h2>
                            <div className="space-y-2">
                                {[
                                    { item: 'Custom Favicon (SVG + PNG)', done: true },
                                    { item: 'Meta Title & Description', done: true },
                                    { item: 'Open Graph Tags', done: true },
                                    { item: 'Twitter Card Tags', done: true },
                                    { item: 'Canonical URLs', done: true },
                                    { item: 'robots.txt', done: true },
                                    { item: 'PWA Manifest', done: true },
                                    { item: 'Social Media Preview Image', done: true },
                                    { item: 'Sitemap.xml', done: false },
                                    { item: 'Structured Data (Schema.org)', done: false },
                                ].map((check, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-900 rounded-lg p-3">
                                        <span className={`text-xl ${check.done ? 'text-green-400' : 'text-slate-600'}`}>
                                            {check.done ? '✓' : '○'}
                                        </span>
                                        <span className={check.done ? 'text-white' : 'text-slate-500'}>
                                            {check.item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {selectedTab === 'feedback' && (
                    <div className="space-y-6">
                        {/* Feedback Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <div className="text-3xl font-bold text-white mb-1">{feedbackStats.total}</div>
                                <div className="text-slate-400 text-sm">Total Feedback</div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <div className="text-3xl font-bold text-amber-400 mb-1">{feedbackStats.avgRating}</div>
                                <div className="text-slate-400 text-sm">Avg Rating</div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <div className="text-3xl font-bold text-red-400 mb-1">{feedbackStats.unreviewed}</div>
                                <div className="text-slate-400 text-sm">Unreviewed</div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <div className="text-3xl font-bold text-emerald-400 mb-1">
                                    {feedbackStats.total - feedbackStats.unreviewed}
                                </div>
                                <div className="text-slate-400 text-sm">Reviewed</div>
                            </div>
                        </div>

                        {/* Feedback by Type */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Feedback by Type</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(feedbackStats.byType).map(([type, count]) => (
                                    <div key={type} className="bg-slate-800/50 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-amber-400 mb-1">{count}</div>
                                        <div className="text-slate-400 text-xs capitalize">{type}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFeedbackFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'all'
                                        ? 'bg-amber-400 text-slate-900'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFeedbackFilter('unreviewed')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'unreviewed'
                                        ? 'bg-amber-400 text-slate-900'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                Unreviewed ({feedbackStats.unreviewed})
                            </button>
                            {['initial', 'general', 'micro', 'bug', 'feature'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFeedbackFilter(type)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${feedbackFilter === type
                                            ? 'bg-amber-400 text-slate-900'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Feedback List */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800">
                                <h3 className="text-lg font-semibold text-white">Feedback Entries</h3>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {feedback
                                    .filter((fb) => {
                                        if (feedbackFilter === 'all') return true;
                                        if (feedbackFilter === 'unreviewed') return !fb.reviewed;
                                        return fb.feedback_type === feedbackFilter;
                                    })
                                    .map((fb) => (
                                        <div
                                            key={fb.id}
                                            className={`px-6 py-4 hover:bg-slate-800/30 transition-colors ${!fb.reviewed ? 'border-l-4 border-amber-400' : ''
                                                }`}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">
                                                        {fb.feedback_type === 'initial' && '⭐'}
                                                        {fb.feedback_type === 'general' && '💬'}
                                                        {fb.feedback_type === 'micro' && '👍'}
                                                        {fb.feedback_type === 'bug' && '🐛'}
                                                        {fb.feedback_type === 'feature' && '✨'}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium">
                                                                {fb.user?.email || 'Anonymous'}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${fb.feedback_type === 'bug'
                                                                        ? 'bg-red-500/20 text-red-400'
                                                                        : fb.feedback_type === 'feature'
                                                                            ? 'bg-purple-500/20 text-purple-400'
                                                                            : 'bg-slate-700 text-slate-300'
                                                                    }`}
                                                            >
                                                                {fb.feedback_type}
                                                            </span>
                                                            {!fb.reviewed && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-500 text-xs mt-1">
                                                            {formatDate(fb.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {fb.overall_rating && (
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: fb.overall_rating }).map((_, i) => (
                                                            <span key={i} className="text-amber-400">
                                                                ⭐
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-2 mb-3">
                                                {fb.what_you_like && (
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                                        <p className="text-emerald-400 text-xs font-semibold mb-1">
                                                            👍 What they like:
                                                        </p>
                                                        <p className="text-slate-300 text-sm">{fb.what_you_like}</p>
                                                    </div>
                                                )}
                                                {fb.what_to_improve && (
                                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                                        <p className="text-amber-400 text-xs font-semibold mb-1">
                                                            💡 What to improve:
                                                        </p>
                                                        <p className="text-slate-300 text-sm">{fb.what_to_improve}</p>
                                                    </div>
                                                )}
                                                {fb.general_comment && (
                                                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                                                        <p className="text-slate-300 text-sm">{fb.general_comment}</p>
                                                    </div>
                                                )}
                                                {fb.task_helpful !== null && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-slate-400">Task helpful:</span>
                                                        <span className={fb.task_helpful ? 'text-emerald-400' : 'text-red-400'}>
                                                            {fb.task_helpful ? '👍 Yes' : '👎 No'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                                <div className="text-slate-500 text-xs">
                                                    {fb.plan?.plan_summary && (
                                                        <span className="line-clamp-1">
                                                            Plan: {fb.plan.plan_summary.substring(0, 50)}...
                                                        </span>
                                                    )}
                                                </div>
                                                {!fb.reviewed && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await markFeedbackReviewed(fb.id);
                                                                await loadAdminData();
                                                            } catch (error) {
                                                                console.error('Failed to mark as reviewed:', error);
                                                                alert('Error marking as reviewed');
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs transition-colors"
                                                    >
                                                        ✓ Mark as Reviewed
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                {feedback.filter((fb) => {
                                    if (feedbackFilter === 'all') return true;
                                    if (feedbackFilter === 'unreviewed') return !fb.reviewed;
                                    return fb.feedback_type === feedbackFilter;
                                }).length === 0 && (
                                        <div className="px-6 py-12 text-center text-slate-500">
                                            No feedback found for this filter
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
