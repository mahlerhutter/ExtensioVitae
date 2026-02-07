import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, TrendingUp, Clock, Zap } from 'lucide-react';
import { logSmartActivity, getTodayLogs, deleteActivityLog, PILLAR_META } from '../../lib/smartLogService';

const PLACEHOLDER_EXAMPLES = [
    '1h joggen im Park',
    'Steak mit Gemüse gegessen',
    '20min Meditation',
    'Sauna 15min',
    'Mit Freunden Abendessen',
    '7.5h geschlafen',
    'Kalt geduscht 3min',
    'Wim Hof Atemübung',
    '5h Bergtour',
    'Supplements genommen',
    '30min Krafttraining',
    'Spaziergang in der Natur'
];

export default function SmartLogWidget() {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [placeholder, setPlaceholder] = useState('');
    const inputRef = useRef(null);

    // Rotating placeholder
    useEffect(() => {
        let idx = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length);
        setPlaceholder(PLACEHOLDER_EXAMPLES[idx]);

        const interval = setInterval(() => {
            idx = (idx + 1) % PLACEHOLDER_EXAMPLES.length;
            setPlaceholder(PLACEHOLDER_EXAMPLES[idx]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Load today's logs on mount
    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        const data = await getTodayLogs();
        setLogs(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        const result = await logSmartActivity(input.trim());

        if (result.success) {
            setInput('');
            await loadLogs();
            inputRef.current?.focus();
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    const handleDelete = async (logId) => {
        const result = await deleteActivityLog(logId);
        if (result.success) {
            setLogs(logs.filter(l => l.id !== logId));
        }
    };

    // Calculate pillar summary
    const pillarSummary = {};
    for (const log of logs) {
        if (!pillarSummary[log.pillar]) {
            pillarSummary[log.pillar] = { count: 0, minutes: 0 };
        }
        pillarSummary[log.pillar].count++;
        pillarSummary[log.pillar].minutes += log.duration_minutes || 0;

        if (log.secondary_pillar) {
            if (!pillarSummary[log.secondary_pillar]) {
                pillarSummary[log.secondary_pillar] = { count: 0, minutes: 0 };
            }
            pillarSummary[log.secondary_pillar].count++;
        }
    }

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Smart Log</h3>
                        <p className="text-sm text-slate-400">Tippe was du gemacht hast — AI trackt es</p>
                    </div>
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-slate-800">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={placeholder}
                            disabled={isLoading}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                            autoComplete="off"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
            </form>

            {/* Pillar Summary (compact) */}
            {Object.keys(pillarSummary).length > 0 && (
                <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap gap-2">
                    {Object.entries(pillarSummary).map(([pillar, data]) => {
                        const meta = PILLAR_META[pillar];
                        if (!meta) return null;
                        return (
                            <span
                                key={pillar}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}
                            >
                                <span>{meta.emoji}</span>
                                <span>{meta.label}</span>
                                <span className="opacity-60">×{data.count}</span>
                                {data.minutes > 0 && (
                                    <span className="opacity-60">· {data.minutes}min</span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Activity Feed */}
            <div className="max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-slate-500 text-sm">
                            Noch keine Einträge heute.
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                            Probier's: "1h joggen", "Steak gegessen", "20min meditiert"
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {logs.map((log) => {
                            const meta = PILLAR_META[log.pillar] || PILLAR_META.movement;

                            return (
                                <div
                                    key={log.id}
                                    className="px-6 py-4 hover:bg-slate-800/30 transition-colors group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <span className="text-2xl shrink-0 mt-0.5">{log.display_emoji}</span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-white font-medium">{log.display_text || log.activity}</span>
                                                    {log.secondary_pillar && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${PILLAR_META[log.secondary_pillar]?.bgColor} ${PILLAR_META[log.secondary_pillar]?.color}`}>
                                                            +{PILLAR_META[log.secondary_pillar]?.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className={`${meta.color}`}>{meta.emoji} {meta.label}</span>
                                                    {log.duration_minutes && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {log.duration_minutes}min
                                                        </span>
                                                    )}
                                                    {log.intensity && (
                                                        <span className={`capitalize ${log.intensity === 'high' ? 'text-red-400' :
                                                                log.intensity === 'medium' ? 'text-yellow-400' :
                                                                    'text-green-400'
                                                            }`}>
                                                            {log.intensity === 'high' ? '🔥' : log.intensity === 'medium' ? '⚡' : '🌱'} {log.intensity}
                                                        </span>
                                                    )}
                                                    {log.longevity_impact && (
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3 text-amber-400" />
                                                            {log.longevity_impact}/10
                                                        </span>
                                                    )}
                                                    <span>
                                                        {new Date(log.logged_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {logs.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500 text-center">
                    {logs.length} {logs.length === 1 ? 'Aktivität' : 'Aktivitäten'} heute ·
                    {' '}{logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)} min gesamt
                </div>
            )}
        </div>
    );
}
