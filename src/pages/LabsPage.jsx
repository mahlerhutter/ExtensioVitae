import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import LabUpload from '../components/bloodcheck/LabUpload';
import LabResultDetails from '../components/bloodcheck/LabResultDetails';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LabsPage() {
    useDocumentTitle('Lab Results - ExtensioVitae');
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [labResults, setLabResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResultId, setSelectedResultId] = useState(null);

    useEffect(() => {
        fetchLabResults();
    }, [user]);

    const fetchLabResults = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('lab_results')
                .select('*')
                .eq('user_id', user.id)
                .order('test_date', { ascending: false });

            if (error) throw error;
            setLabResults(data || []);
        } catch (error) {
            logger.error('Error fetching lab results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (newResult) => {
        setLabResults([newResult, ...labResults]);
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHeader
                userName={user?.email} // Fallback, usually we get name from profile
                onSignOut={signOut}
                onProfileClick={() => navigate('/health-profile')}
            />

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        ←
                    </button>
                    <h1 className="text-2xl font-bold text-white">Lab Results</h1>
                </div>

                {/* Upload Section */}
                <section className="mb-12">
                    <LabUpload onUploadComplete={handleUploadComplete} />
                </section>

                {/* Results List */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span>🔬</span> Historie
                    </h2>

                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Lade Ergebnisse...</div>
                    ) : labResults.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                            <p className="text-slate-400 mb-2">Noch keine Laborberichte.</p>
                            <p className="text-sm text-slate-500">Lade deinen ersten Bericht oben hoch.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {labResults.map((result) => (
                                <div key={result.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xl">
                                            📄
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {result.provider || 'Manueller Upload'}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                {new Date(result.test_date).toLocaleDateString()} • {result.status.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedResultId(result.id)}
                                        className="text-sm text-amber-400 hover:text-amber-300 font-medium"
                                    >
                                        Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Details Modal */}
            {selectedResultId && (
                <LabResultDetails
                    resultId={selectedResultId}
                    onClose={() => setSelectedResultId(null)}
                />
            )}
        </div>
    );
}
