import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Sparkles, GitBranch, ArrowRight, Lock } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const sections = [
    {
        id: 'future',
        title: 'Future Vision',
        subtitle: 'Die langfristige Vision',
        description: 'Ein tiefer Einblick in die strategische Ausrichtung von ExtensioVitae. Erfahre mehr über unsere Mission, die Roadmap und die Vision eines autonomen biologischen Betriebssystems.',
        icon: Sparkles,
        gradient: 'from-purple-600 to-pink-600',
        path: '/friends/future',
        emoji: '🔮',
        highlights: [
            'Strategische Horizonte (H1, H2, H3)',
            'Biological OS Architecture',
            'Family Office Integration',
            'Long-term Milestones',
        ],
    },
    {
        id: 'features',
        title: 'Features Roadmap',
        subtitle: 'Was kommt als Nächstes?',
        description: 'Eine detaillierte Übersicht über geplante Features, Module und Integrationen. Von Wearables über Lab Results bis hin zum AI Coach - hier siehst du, was in der Pipeline ist.',
        icon: GitBranch,
        gradient: 'from-blue-600 to-cyan-600',
        path: '/friends/features',
        emoji: '🗺️',
        highlights: [
            'Upcoming Modules',
            'Integration Pipeline',
            'Feature Priorities',
            'Technical Roadmap',
        ],
    },
    {
        id: 'versions',
        title: 'Version History',
        subtitle: 'Von v0.1 zu v1.0',
        description: 'Die komplette Versionsgeschichte von ExtensioVitae. Sieh, wie sich die Plattform entwickelt hat und welche Meilensteine auf dem Weg zu v1.0 noch bevorstehen.',
        icon: Rocket,
        gradient: 'from-amber-600 to-orange-600',
        path: '/friends/versions',
        emoji: '🚀',
        highlights: [
            'Complete Version History',
            'Key Features per Release',
            'Roadmap to v1.0',
            'Development Metrics',
        ],
    },
];

export default function FriendsPage() {
    useDocumentTitle('Friends & Family - ExtensioVitae');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <DashboardHeader />

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full px-4 py-2 mb-6">
                        <Lock className="w-4 h-4 text-purple-300" />
                        <span className="text-purple-200 text-sm font-medium">Friends & Family Access</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Welcome to the Inner Circle
                    </h1>
                    <p className="text-xl text-purple-200 max-w-3xl mx-auto">
                        Exklusiver Zugang zu unserer Vision, Roadmap und Entwicklungsgeschichte.
                        Diese Seiten sind nur für vertraute Partner und Early Adopters zugänglich.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={section.id}
                                onClick={() => navigate(section.path)}
                                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                            >
                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon & Emoji */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-4 bg-gradient-to-br ${section.gradient} rounded-xl`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-5xl">{section.emoji}</span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {section.title}
                                    </h2>
                                    <p className="text-purple-300 text-sm mb-4">
                                        {section.subtitle}
                                    </p>

                                    {/* Description */}
                                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                        {section.description}
                                    </p>

                                    {/* Highlights */}
                                    <ul className="space-y-2 mb-6">
                                        {section.highlights.map((highlight, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-slate-400">
                                                <span className="text-purple-400 mr-2">•</span>
                                                {highlight}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                                        <span className="text-sm font-semibold">Explore</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Confidential Information</h3>
                    </div>
                    <p className="text-slate-300 max-w-2xl mx-auto">
                        Die hier geteilten Informationen sind vertraulich und nur für Friends & Family bestimmt.
                        Bitte behandle diese Einblicke mit Diskretion und teile sie nicht öffentlich.
                    </p>
                </div>

                {/* Easter Egg */}
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm italic">
                        "The future is already here — it's just not evenly distributed." — William Gibson
                    </p>
                </div>
            </div>
        </div>
    );
}
