import React, { useState, useEffect } from 'react';
import logger from '../lib/logger';

export default function LogViewer() {
    const [logs, setLogs] = useState([]);
    const [filterLevel, setFilterLevel] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Load logs
    const loadLogs = () => {
        const allLogs = logger.getLogs();
        setLogs(allLogs);
    };

    // Auto-refresh logs every 2 seconds
    useEffect(() => {
        loadLogs();

        if (autoRefresh) {
            const interval = setInterval(loadLogs, 2000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    // Filter logs
    const filteredLogs = logs.filter(log => {
        const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
        const matchesSearch = searchTerm === '' ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesLevel && matchesSearch;
    });

    // Export handlers
    const handleExportJSON = () => {
        const dataStr = logger.exportLogs();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extensiovitae-logs-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const dataStr = logger.exportLogsCSV();
        const dataBlob = new Blob([dataStr], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extensiovitae-logs-${new Date().toISOString()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleClearLogs = () => {
        if (window.confirm('Alle Logs löschen? Dies kann nicht rückgängig gemacht werden.')) {
            logger.clearLogs();
            loadLogs();
        }
    };

    // Get level badge styling
    const getLevelBadge = (level) => {
        const styles = {
            DEBUG: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            INFO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            WARN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            ERROR: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return styles[level] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">System Logs</h2>
                    <p className="text-sm text-slate-400">
                        {filteredLogs.length} von {logs.length} Einträgen | Log Level: {logger.getLogLevel()}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${autoRefresh
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                    >
                        {autoRefresh ? '🔄 Auto' : '⏸️ Pause'}
                    </button>

                    {/* Refresh button */}
                    <button
                        onClick={loadLogs}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all border border-slate-700"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* Level filter */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Filter by Level</label>
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    >
                        <option value="ALL">Alle Levels</option>
                        <option value="DEBUG">DEBUG</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                    </select>
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Search</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Suche in Nachrichten und Daten..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all border border-slate-700"
                >
                    📥 Export JSON
                </button>
                <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all border border-slate-700"
                >
                    📊 Export CSV
                </button>
                <button
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-all border border-red-500/30"
                >
                    🗑️ Clear All
                </button>
            </div>

            {/* Logs table */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Keine Logs gefunden
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Data
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleTimeString('de-DE')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getLevelBadge(log.level)}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-white">
                                            {log.message}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.data && (
                                                <details className="cursor-pointer">
                                                    <summary className="text-xs text-slate-400 hover:text-slate-300">
                                                        View data
                                                    </summary>
                                                    <pre className="mt-2 text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-700 overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
