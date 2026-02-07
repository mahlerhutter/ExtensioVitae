import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Target, TrendingUp, Zap, Calendar, Users, Activity } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const versions = [
    {
        version: 'v0.6.4',
        name: 'Beta Ready',
        date: '2026-02-07',
        status: 'current',
        completion: 100,
        icon: '🛡️',
        color: 'from-amber-500 to-orange-600',
        features: [
            'Gesamte Critical Path auf Deutsch übersetzt',
            'OnboardingGuard Fix (user_plans → plans)',
            'Version Badge korrigiert',
            'Console.log → Logger Migration',
            'i18n Roadmap dokumentiert (v0.7.0)',
            'Beta Readiness Audit bestanden (8/10)',
        ],
        metrics: {
            edgeFunctions: 8,
            components: 40,
            uxScore: 92,
        },
    },
    {
        version: 'v0.6.3',
        name: 'Zerberus',
        date: '2026-02-06',
        status: 'released',
        completion: 95,
        icon: '🧠',
        color: 'from-purple-600 to-blue-600',
        features: [
            'Wearable Integration (Oura, WHOOP)',
            'Recovery Dashboard mit HRV/Sleep/RHR',
            'Smart Task Recommendation',
            '8 Edge Functions deployed',
            'Partitioned Database Tables',
            'OAuth 2.0 Flow',
            'Friends & Family Hub',
            'Version History Page',
        ],
        metrics: {
            edgeFunctions: 8,
            components: 40,
            uxScore: 92,
        },
    },
    {
        version: 'v0.5.0',
        name: 'UX Week 1',
        date: '2026-02-05',
        status: 'deployed',
        completion: 100,
        icon: '✨',
        color: 'from-green-600 to-teal-600',
        features: [
            '11 Premium UX Components',
            'Longevity Score Widget',
            'Circadian Rhythm Card',
            'Lab Results Upload',
            'Trend Charts (Recharts)',
            'WhatsApp & Calendar Export',
        ],
        metrics: {
            edgeFunctions: 3,
            components: 33,
            uxScore: 92,
        },
    },
    {
        version: 'v0.4.0',
        name: 'Analytics & Admin',
        date: '2026-02-02',
        status: 'deployed',
        completion: 100,
        icon: '📊',
        color: 'from-blue-600 to-cyan-600',
        features: [
            'PostHog Analytics',
            'Admin Dashboard',
            'User Management',
            'Feedback System (3 Types)',
            'Event Tracking',
        ],
        metrics: {
            edgeFunctions: 2,
            components: 22,
            uxScore: 80,
        },
    },
    {
        version: 'v0.3.0',
        name: 'Dashboard Core',
        date: '2026-01-15',
        status: 'deployed',
        completion: 100,
        icon: '📅',
        color: 'from-indigo-600 to-purple-600',
        features: [
            'Personalisiertes Dashboard',
            'Month Overview Kalender',
            'Day Detail View',
            'Protocol Library',
            'Mode Selector',
        ],
        metrics: {
            edgeFunctions: 1,
            components: 18,
            uxScore: 70,
        },
    },
    {
        version: 'v0.2.0',
        name: 'Intake System',
        date: '2026-01-05',
        status: 'deployed',
        completion: 100,
        icon: '📝',
        color: 'from-orange-600 to-red-600',
        features: [
            'Multi-Step Intake Form',
            'Health Profile Erfassung',
            'LLM-basierte Plan-Generierung',
            'Progress Bar',
        ],
        metrics: {
            edgeFunctions: 1,
            components: 12,
            uxScore: 65,
        },
    },
    {
        version: 'v0.1.0',
        name: 'Foundation',
        date: '2025-12-15',
        status: 'deployed',
        completion: 100,
        icon: '🏗️',
        color: 'from-gray-600 to-slate-600',
        features: [
            'Supabase Backend Setup',
            'React Frontend mit Vite',
            'Basic Authentication',
            'User Profiles',
            'Database Schema',
        ],
        metrics: {
            edgeFunctions: 0,
            components: 8,
            uxScore: 60,
        },
    },
];

const roadmap = [
    {
        version: 'v0.7.0',
        name: 'Lab Results Intelligence',
        date: 'Feb 2026',
        status: 'planned',
        icon: '🧪',
        color: 'from-pink-600 to-rose-600',
        features: [
            'Claude 3.5 Sonnet OCR',
            'Biomarker Trend Visualization',
            'Out-of-Range Alerts',
            'Supplement Recommendations',
            'Lab Test Ordering',
        ],
    },
    {
        version: 'v0.8.0',
        name: 'Mobile Optimization',
        date: 'März 2026',
        status: 'planned',
        icon: '📱',
        color: 'from-violet-600 to-purple-600',
        features: [
            'Responsive Design Audit',
            'Touch-optimierte Interaktionen',
            'PWA Support',
            'Push Notifications',
            'Mobile Onboarding',
        ],
    },
    {
        version: 'v0.9.0',
        name: 'AI Coach',
        date: 'März 2026',
        status: 'planned',
        icon: '🤖',
        color: 'from-cyan-600 to-blue-600',
        features: [
            'Chat Interface',
            'Context-aware Responses',
            'Plan Adjustments via Chat',
            'Proactive Suggestions',
            'Voice Input',
        ],
    },
    {
        version: 'v1.0.0',
        name: 'Production Ready',
        date: 'April 2026',
        status: 'goal',
        icon: '🚀',
        color: 'from-amber-600 to-orange-600',
        features: [
            'Complete Wearable Integration',
            'Apple Health Integration',
            'Production Monitoring',
            'Security Audit',
            'Subscription System',
            'Marketing Website',
        ],
    },
];

export default function VersionsPage() {
    useDocumentTitle('Versions & Roadmap - ExtensioVitae');
    const navigate = useNavigate();

    const getStatusBadge = (status, completion) => {
        switch (status) {
            case 'current':
                return (
                    <div className="flex items-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mr-2">
                            AKTUELL
                        </span>
                        <span className="text-sm text-gray-600">{completion}% Complete</span>
                    </div>
                );
            case 'deployed':
                return (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        DEPLOYED
                    </span>
                );
            case 'planned':
                return (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        GEPLANT
                    </span>
                );
            case 'goal':
                return (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        ZIEL
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
            <DashboardHeader />

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Version History & Roadmap
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Von Foundation zu Production - Die Evolution von ExtensioVitae
                    </p>
                </div>

                {/* Current Version Highlight */}
                <div className="mb-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="text-sm opacity-75 mb-2">Aktuelle Version</div>
                            <h2 className="text-4xl font-bold mb-2">v0.6.4 Beta Ready</h2>
                            <h3 className="text-2xl opacity-90">Stabilisation & Lokalisierung</h3>
                        </div>
                        <span className="text-6xl">🧠</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-3xl font-bold">8</div>
                            <div className="text-sm opacity-75">Edge Functions</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-3xl font-bold">40</div>
                            <div className="text-sm opacity-75">Components</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-3xl font-bold">92%</div>
                            <div className="text-sm opacity-75">UX Score</div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Completion</span>
                            <span className="text-sm font-bold">95%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-white rounded-full h-2" style={{ width: '95%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Version History */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-purple-600" />
                        Version History
                    </h2>

                    <div className="space-y-4">
                        {versions.map((v, idx) => (
                            <div
                                key={v.version}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start">
                                        <span className="text-4xl mr-4">{v.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">{v.version}</h3>
                                                {getStatusBadge(v.status, v.completion)}
                                            </div>
                                            <h4 className="text-lg text-gray-700 mb-1">{v.name}</h4>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {v.date}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="font-semibold text-gray-900 mb-2">Key Features</h5>
                                        <ul className="space-y-1">
                                            {v.features.map((feature, fidx) => (
                                                <li key={fidx} className="text-sm text-gray-700 flex items-start">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h5 className="font-semibold text-gray-900 mb-2">Metrics</h5>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-gray-900">{v.metrics.edgeFunctions}</div>
                                                <div className="text-xs text-gray-600">Functions</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-gray-900">{v.metrics.components}</div>
                                                <div className="text-xs text-gray-600">Components</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-gray-900">{v.metrics.uxScore}%</div>
                                                <div className="text-xs text-gray-600">UX Score</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Roadmap */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
                        Roadmap to v1.0
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {roadmap.map((v, idx) => (
                            <div
                                key={v.version}
                                className={`bg-gradient-to-br ${v.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-2xl font-bold">{v.version}</h3>
                                            {getStatusBadge(v.status)}
                                        </div>
                                        <h4 className="text-lg opacity-90 mb-1">{v.name}</h4>
                                        <div className="text-sm opacity-75">{v.date}</div>
                                    </div>
                                    <span className="text-5xl">{v.icon}</span>
                                </div>

                                <ul className="space-y-2">
                                    {v.features.map((feature, fidx) => (
                                        <li key={fidx} className="text-sm opacity-90 flex items-start">
                                            <span className="mr-2">•</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                        Progress to v1.0
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">6/10</div>
                            <div className="text-sm text-gray-600">Versions Deployed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">40</div>
                            <div className="text-sm text-gray-600">Components Built</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">8</div>
                            <div className="text-sm text-gray-600">Edge Functions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">92%</div>
                            <div className="text-sm text-gray-600">UX Score</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
