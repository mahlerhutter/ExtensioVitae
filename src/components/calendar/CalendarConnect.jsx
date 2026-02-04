import React from 'react';
import { useCalendar } from '../../contexts/CalendarContext';

/**
 * Calendar Connect Component
 * Button to connect Google Calendar with OAuth flow
 */
export default function CalendarConnect({ variant = 'default' }) {
    const { isConnected, isConnecting, connectCalendar, disconnectCalendar } = useCalendar();

    if (isConnected) {
        return (
            <CalendarConnectedStatus
                onDisconnect={disconnectCalendar}
                variant={variant}
            />
        );
    }

    return (
        <button
            onClick={connectCalendar}
            disabled={isConnecting}
            className={`
        ${variant === 'compact'
                    ? 'w-full py-2 text-sm'
                    : 'w-full py-3'
                }
        bg-blue-500 hover:bg-blue-600 
        disabled:bg-slate-700 disabled:cursor-not-allowed
        text-white font-medium rounded-lg 
        transition-all shadow-lg shadow-blue-500/10
        flex items-center justify-center gap-2
      `}
        >
            {isConnecting ? (
                <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                    </svg>
                    <span>Connect Google Calendar</span>
                </>
            )}
        </button>
    );
}

/**
 * Calendar Connected Status Component
 * Shows when calendar is connected
 */
function CalendarConnectedStatus({ onDisconnect, variant }) {
    const { connection, lastSync, isSyncing, syncCalendar } = useCalendar();

    const formatLastSync = () => {
        if (!lastSync) return 'Never';

        const now = new Date();
        const diff = now - lastSync;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (variant === 'compact') {
        return (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-300 text-sm font-medium">Calendar Connected</span>
                    </div>
                    <button
                        onClick={syncCalendar}
                        disabled={isSyncing}
                        className="text-green-400 hover:text-green-300 transition-colors"
                    >
                        <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                <p className="text-green-400/70 text-xs mt-1">
                    Last sync: {formatLastSync()}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Calendar Connected</h3>
                        <p className="text-slate-400 text-sm">{connection?.email}</p>
                    </div>
                </div>
                <button
                    onClick={syncCalendar}
                    disabled={isSyncing}
                    className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    title="Sync now"
                >
                    <svg className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Last sync:</span>
                    <span className="text-white">{formatLastSync()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-white">Google Calendar</span>
                </div>
            </div>

            <button
                onClick={onDisconnect}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 font-medium rounded-lg transition-all border border-slate-700 hover:border-red-500/30 text-sm"
            >
                Disconnect Calendar
            </button>
        </div>
    );
}
