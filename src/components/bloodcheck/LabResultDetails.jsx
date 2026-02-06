import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export default function LabResultDetails({ resultId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [biomarkers, setBiomarkers] = useState([]);

    useEffect(() => {
        fetchDetails();
    }, [resultId]);

    const fetchDetails = async () => {
        try {
            // Fetch lab result metadata
            const { data: resultData, error: resultError } = await supabase
                .from('lab_results')
                .select('*')
                .eq('id', resultId)
                .single();

            if (resultError) throw resultError;
            setResult(resultData);

            // Fetch biomarkers
            const { data: biomarkersData, error: biomarkersError } = await supabase
                .from('biomarkers')
                .select('*')
                .eq('result_id', resultId)
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (biomarkersError) throw biomarkersError;
            setBiomarkers(biomarkersData || []);

        } catch (error) {
            logger.error('[LabResultDetails] Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group biomarkers by category
    const groupedBiomarkers = biomarkers.reduce((acc, marker) => {
        const category = marker.category || 'Andere';
        if (!acc[category]) acc[category] = [];
        acc[category].push(marker);
        return acc;
    }, {});

    const getStatusColor = (marker) => {
        if (!marker.ref_range_low && !marker.ref_range_high) return 'text-slate-400';

        const value = parseFloat(marker.value);
        const low = parseFloat(marker.ref_range_low);
        const high = parseFloat(marker.ref_range_high);

        if (low && value < low) return 'text-red-400';
        if (high && value > high) return 'text-red-400';
        return 'text-emerald-400';
    };

    const getStatusIcon = (marker) => {
        if (!marker.ref_range_low && !marker.ref_range_high) return '○';

        const value = parseFloat(marker.value);
        const low = parseFloat(marker.ref_range_low);
        const high = parseFloat(marker.ref_range_high);

        if (low && value < low) return '↓';
        if (high && value > high) return '↑';
        return '✓';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-slate-900 rounded-xl p-8 max-w-2xl w-full mx-4">
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-xl max-w-4xl w-full my-8 border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Laborergebnisse</h2>
                        <p className="text-slate-400 text-sm">
                            {result?.provider} • {new Date(result?.test_date).toLocaleDateString('de-DE')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Status Badge */}
                <div className="px-6 pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        <div className={`w-2 h-2 rounded-full ${result?.status === 'completed' ? 'bg-emerald-400' :
                            result?.status === 'failed' ? 'bg-red-400' :
                                'bg-amber-400 animate-pulse'
                            }`}></div>
                        <span className="text-sm text-slate-300 font-medium capitalize">
                            {result?.status === 'completed' ? 'Analysiert' :
                                result?.status === 'failed' ? 'Fehler' :
                                    result?.status === 'processing' ? 'Wird analysiert...' : 'Ausstehend'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {biomarkers.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                            <p className="text-slate-400 mb-2">Keine Biomarker gefunden</p>
                            <p className="text-sm text-slate-500">
                                {result?.status === 'pending' ? 'Die Analyse wurde noch nicht gestartet.' :
                                    result?.status === 'processing' ? 'Die Analyse läuft gerade...' :
                                        'Die KI konnte keine Werte extrahieren.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedBiomarkers).map(([category, markers]) => (
                                <div key={category}>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        {category}
                                    </h3>
                                    <div className="space-y-2">
                                        {markers.map((marker) => (
                                            <div
                                                key={marker.id}
                                                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className={`text-xl font-mono ${getStatusColor(marker)}`}>
                                                        {getStatusIcon(marker)}
                                                    </span>
                                                    <div>
                                                        <p className="text-white font-medium">{marker.name}</p>
                                                        {marker.ref_range_low && marker.ref_range_high && (
                                                            <p className="text-xs text-slate-500">
                                                                Referenz: {marker.ref_range_low} - {marker.ref_range_high} {marker.unit}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${getStatusColor(marker)}`}>
                                                        {marker.value}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{marker.unit}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    {result?.notes && (
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400">{result.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                        Schließen
                    </button>
                    {biomarkers.length > 0 && (
                        <button
                            onClick={() => {
                                // Export as PDF/CSV - planned for v0.7.0 (Lab Results Intelligence)
                                logger.info('[LabResultDetails] Export clicked');
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                        >
                            Exportieren
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
