import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Lightbulb, Bug, Flame, Calendar, Tag, Clock } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Rating types with icons and colors
const RATING_TYPES = {
    critical: { icon: Flame, label: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500/10', emoji: '🔥' },
    bug: { icon: Bug, label: 'Bug', color: 'text-orange-500', bgColor: 'bg-orange-500/10', emoji: '🐛' },
    usability: { icon: AlertCircle, label: 'Usability Issue', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', emoji: '⚠️' },
    works: { icon: CheckCircle, label: 'Works Well', color: 'text-green-500', bgColor: 'bg-green-500/10', emoji: '✅' },
    idea: { icon: Lightbulb, label: 'Feature Idea', color: 'text-blue-500', bgColor: 'bg-blue-500/10', emoji: '💡' }
};

const AREAS = [
    'Onboarding',
    'Dashboard',
    'Tasks',
    'Morning Check-In',
    'Recovery',
    'Analytics',
    'Navigation',
    'Performance',
    'Copy/Text',
    'Visual Design',
    'Other'
];

export default function DogfoodingPage() {
    useDocumentTitle('Dogfooding Log - ExtensioVitae');
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [newLog, setNewLog] = useState({
        type: 'usability',
        area: 'Dashboard',
        title: '',
        description: '',
        effort: '',
        priority: 'P2'
    });

    // Load logs from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('dogfooding_logs');
        if (stored) {
            setLogs(JSON.parse(stored));
        }
    }, []);

    // Save logs to localStorage whenever they change
    useEffect(() => {
        if (logs.length > 0) {
            localStorage.setItem('dogfooding_logs', JSON.stringify(logs));
        }
    }, [logs]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newLog.title.trim()) {
            alert('Bitte einen Titel eingeben');
            return;
        }

        const log = {
            id: Date.now(),
            ...newLog,
            timestamp: new Date().toISOString(),
            day: Math.ceil((Date.now() - new Date('2026-02-07').getTime()) / (1000 * 60 * 60 * 24))
        };

        setLogs([log, ...logs]);

        // Reset form
        setNewLog({
            type: 'usability',
            area: 'Dashboard',
            title: '',
            description: '',
            effort: '',
            priority: 'P2'
        });
    };

    const handleDelete = (id) => {
        if (confirm('Log-Eintrag löschen?')) {
            setLogs(logs.filter(log => log.id !== id));
        }
    };

    const exportToMarkdown = () => {
        let md = `# Dogfooding Logs Export\n\n**Exported:** ${new Date().toLocaleString()}\n**Total Entries:** ${logs.length}\n\n---\n\n`;

        logs.forEach(log => {
            const type = RATING_TYPES[log.type];
            md += `## ${type.emoji} ${log.title}\n\n`;
            md += `- **Type:** ${type.label}\n`;
            md += `- **Area:** ${log.area}\n`;
            md += `- **Day:** ${log.day}\n`;
            md += `- **Priority:** ${log.priority}\n`;
            if (log.effort) md += `- **Effort:** ${log.effort}\n`;
            md += `- **Time:** ${new Date(log.timestamp).toLocaleString()}\n\n`;
            if (log.description) md += `**Description:**\n${log.description}\n\n`;
            md += `---\n\n`;
        });

        // Download as file
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dogfood_export_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
    };

    const stats = {
        total: logs.length,
        critical: logs.filter(l => l.type === 'critical').length,
        bugs: logs.filter(l => l.type === 'bug').length,
        usability: logs.filter(l => l.type === 'usability').length,
        works: logs.filter(l => l.type === 'works').length,
        ideas: logs.filter(l => l.type === 'idea').length
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader />

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">🐕 Dogfooding Log</h1>
                    <p className="text-slate-400">
                        Internal Testing: Feb 7-20, 2026 · Tag {Math.ceil((Date.now() - new Date('2026-02-07').getTime()) / (1000 * 60 * 60 * 24))} / 14
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-sm text-slate-400">Total</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 border border-red-900/30">
                        <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
                        <div className="text-sm text-slate-400">🔥 Critical</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 border border-orange-900/30">
                        <div className="text-2xl font-bold text-orange-500">{stats.bugs}</div>
                        <div className="text-sm text-slate-400">🐛 Bugs</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 border border-yellow-900/30">
                        <div className="text-2xl font-bold text-yellow-500">{stats.usability}</div>
                        <div className="text-sm text-slate-400">⚠️ Usability</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 border border-green-900/30">
                        <div className="text-2xl font-bold text-green-500">{stats.works}</div>
                        <div className="text-sm text-slate-400">✅ Works</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 border border-blue-900/30">
                        <div className="text-2xl font-bold text-blue-500">{stats.ideas}</div>
                        <div className="text-sm text-slate-400">💡 Ideas</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Neuer Eintrag</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(RATING_TYPES).map(([key, type]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setNewLog({ ...newLog, type: key })}
                                                className={`p-3 rounded-lg border transition-all ${newLog.type === key
                                                        ? `${type.bgColor} ${type.color} border-${type.color.replace('text-', '')}-500/50`
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="text-xl mb-1">{type.emoji}</div>
                                                <div className="text-xs">{type.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Area */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Bereich</label>
                                    <select
                                        value={newLog.area}
                                        onChange={(e) => setNewLog({ ...newLog, area: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                    >
                                        {AREAS.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Titel *</label>
                                    <input
                                        type="text"
                                        value={newLog.title}
                                        onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                                        placeholder="z.B. Dashboard lädt zu langsam"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Beschreibung</label>
                                    <textarea
                                        value={newLog.description}
                                        onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                                        placeholder="Details, Reproduktion, etc."
                                        rows={3}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                                    />
                                </div>

                                {/* Priority + Effort */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Priorität</label>
                                        <select
                                            value={newLog.priority}
                                            onChange={(e) => setNewLog({ ...newLog, priority: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="P0">P0 - Critical</option>
                                            <option value="P1">P1 - High</option>
                                            <option value="P2">P2 - Medium</option>
                                            <option value="P3">P3 - Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Effort</label>
                                        <input
                                            type="text"
                                            value={newLog.effort}
                                            onChange={(e) => setNewLog({ ...newLog, effort: e.target.value })}
                                            placeholder="z.B. 30min"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium py-3 rounded-lg transition-colors"
                                >
                                    Eintrag hinzufügen
                                </button>
                            </form>

                            {/* Export */}
                            {logs.length > 0 && (
                                <button
                                    onClick={exportToMarkdown}
                                    className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm"
                                >
                                    Export als Markdown
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
                                    <p className="text-slate-400 text-lg mb-2">Noch keine Einträge</p>
                                    <p className="text-slate-500 text-sm">Nutze die App und logge deine Erfahrungen →</p>
                                </div>
                            ) : (
                                logs.map(log => {
                                    const type = RATING_TYPES[log.type];
                                    const Icon = type.icon;

                                    return (
                                        <div
                                            key={log.id}
                                            className={`bg-slate-900 rounded-xl border ${type.bgColor.replace('/10', '/20')} border-slate-800 hover:border-slate-700 transition-colors p-6`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${type.bgColor}`}>
                                                        <Icon className={`w-5 h-5 ${type.color}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">{log.title}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Tag className="w-3 h-3" />
                                                                {log.area}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Tag {log.day}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {log.description && (
                                                <p className="text-slate-300 mb-3 leading-relaxed whitespace-pre-wrap">{log.description}</p>
                                            )}

                                            <div className="flex items-center gap-3 text-sm">
                                                <span className={`px-2 py-1 rounded ${log.priority === 'P0' ? 'bg-red-500/20 text-red-400' :
                                                        log.priority === 'P1' ? 'bg-orange-500/20 text-orange-400' :
                                                            log.priority === 'P2' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {log.priority}
                                                </span>
                                                {log.effort && (
                                                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
                                                        {log.effort}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-1 rounded ${type.bgColor} ${type.color}`}>
                                                    {type.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
