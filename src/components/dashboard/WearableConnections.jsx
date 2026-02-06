// ExtensioVitae - Wearable Connection Widget
// Allows users to connect/disconnect Oura, WHOOP, etc.

import { useState, useEffect } from 'react';
import { Activity, Zap, Watch, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import {
    getWearableConnections,
    initiateOAuth,
    disconnectWearable,
    syncWearableData,
} from '../../services/wearableService';

const DEVICE_CONFIG = {
    oura: {
        name: 'Oura Ring',
        icon: '💍',
        color: 'from-purple-500 to-pink-500',
        description: 'Sleep, HRV, and readiness tracking',
    },
    whoop: {
        name: 'WHOOP',
        icon: '⌚',
        color: 'from-blue-500 to-cyan-500',
        description: 'Recovery, strain, and sleep analysis',
    },
    apple_health: {
        name: 'Apple Health',
        icon: '🍎',
        color: 'from-red-500 to-pink-500',
        description: 'Comprehensive health data',
    },
    garmin: {
        name: 'Garmin',
        icon: '🏃',
        color: 'from-green-500 to-teal-500',
        description: 'Fitness and activity tracking',
    },
    fitbit: {
        name: 'Fitbit',
        icon: '📊',
        color: 'from-indigo-500 to-purple-500',
        description: 'Activity and sleep tracking',
    },
};

export default function WearableConnections() {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            setLoading(true);
            const data = await getWearableConnections();
            setConnections(data);
        } catch (err) {
            console.error('Failed to load connections:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = (deviceType) => {
        try {
            initiateOAuth(deviceType);
        } catch (err) {
            console.error('Failed to initiate OAuth:', err);
            setError(err.message);
        }
    };

    const handleDisconnect = async (deviceType) => {
        if (!confirm(`Disconnect ${DEVICE_CONFIG[deviceType]?.name}?`)) {
            return;
        }

        try {
            await disconnectWearable(deviceType);
            await loadConnections();
        } catch (err) {
            console.error('Failed to disconnect:', err);
            setError(err.message);
        }
    };

    const handleSync = async (deviceType) => {
        try {
            setSyncing({ ...syncing, [deviceType]: true });
            await syncWearableData(deviceType);
            await loadConnections();
        } catch (err) {
            console.error('Failed to sync:', err);
            setError(err.message);
        } finally {
            setSyncing({ ...syncing, [deviceType]: false });
        }
    };

    const isConnected = (deviceType) => {
        return connections.some((c) => c.device_type === deviceType);
    };

    const getConnection = (deviceType) => {
        return connections.find((c) => c.device_type === deviceType);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Loading connections...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Watch className="w-5 h-5 mr-2 text-purple-600" />
                        Wearable Devices
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Connect your devices to track recovery and optimize performance
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">Connection Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(DEVICE_CONFIG).map(([deviceType, config]) => {
                    const connected = isConnected(deviceType);
                    const connection = getConnection(deviceType);
                    const isSyncing = syncing[deviceType];

                    return (
                        <div
                            key={deviceType}
                            className={`
                relative overflow-hidden rounded-lg border-2 p-4 transition-all
                ${connected
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-purple-300'
                                }
              `}
                        >
                            {/* Gradient background for connected devices */}
                            {connected && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`} />
                            )}

                            <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center">
                                        <span className="text-3xl mr-3">{config.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{config.name}</h3>
                                            <p className="text-xs text-gray-600">{config.description}</p>
                                        </div>
                                    </div>
                                    {connected && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                </div>

                                {connected && connection && (
                                    <div className="mb-3 text-xs text-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span>Last sync:</span>
                                            <span className="font-medium">
                                                {connection.last_sync_at
                                                    ? new Date(connection.last_sync_at).toLocaleString()
                                                    : 'Never'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span>Status:</span>
                                            <span className={`font-medium ${connection.sync_status === 'active' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {connection.sync_status}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!connected ? (
                                        <button
                                            onClick={() => handleConnect(deviceType)}
                                            className={`
                        flex-1 px-4 py-2 rounded-lg font-medium text-white
                        bg-gradient-to-r ${config.color}
                        hover:opacity-90 transition-opacity
                      `}
                                        >
                                            Connect
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleSync(deviceType)}
                                                disabled={isSyncing}
                                                className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                            >
                                                {isSyncing ? (
                                                    <>
                                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                                        Syncing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="w-4 h-4 mr-2" />
                                                        Sync Now
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(deviceType)}
                                                className="px-4 py-2 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {connections.length === 0 && (
                <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No devices connected yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Connect a wearable device to start tracking your recovery
                    </p>
                </div>
            )}
        </div>
    );
}
