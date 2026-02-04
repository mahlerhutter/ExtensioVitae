import React, { useState, useEffect, useCallback } from 'react';
import {
  getLabResults,
  getLabResultWithAnalysis,
  parseLabReport,
  checkBloodCheckDue,
  compareLatestResults
} from '../../lib/bloodCheckService';
import { useToast } from '../Toast';
import BloodCheckUpload from './BloodCheckUpload';
import BiomarkerCard from './BiomarkerCard';
import BloodCheckHistory from './BloodCheckHistory';

/**
 * Blood Check Panel
 *
 * Main component for blood test management.
 * Supports OCR upload, manual entry, and results visualization.
 */
export default function BloodCheckPanel({ userId, language = 'de' }) {
  const [view, setView] = useState('overview'); // overview | upload | results | history
  const [labResults, setLabResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [dueStatus, setDueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Load data
  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const [results, due, comp] = await Promise.all([
        getLabResults(userId, 5),
        checkBloodCheckDue(userId),
        compareLatestResults(userId)
      ]);

      setLabResults(results);
      setDueStatus(due);
      setComparison(comp);

      // Auto-select latest result
      if (results.length > 0 && !selectedResult) {
        const analysis = await getLabResultWithAnalysis(results[0].id);
        setSelectedResult(analysis);
      }
    } catch (error) {
      console.error('Error loading blood check data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle file upload
  const handleUpload = async (file) => {
    try {
      addToast(
        language === 'de' ? '📤 Wird analysiert...' : '📤 Analyzing...',
        'info'
      );

      const result = await parseLabReport(file, userId);

      if (result.success) {
        addToast(
          language === 'de'
            ? `✅ ${result.biomarkersFound} Biomarker gefunden!`
            : `✅ ${result.biomarkersFound} biomarkers found!`,
          'success'
        );

        // Reload data
        await loadData();
        setView('results');
      } else {
        addToast(result.error || 'Upload failed', 'error');
      }
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  // Handle result selection
  const handleSelectResult = async (resultId) => {
    try {
      const analysis = await getLabResultWithAnalysis(resultId);
      setSelectedResult(analysis);
      setView('results');
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-48 mb-4" />
        <div className="space-y-3">
          <div className="h-24 bg-slate-800 rounded" />
          <div className="h-24 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩸</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {language === 'de' ? 'Blutbild-Analyse' : 'Blood Panel Analysis'}
              </h2>
              {dueStatus && (
                <p className={`text-sm mt-0.5 ${dueStatus.isDue ? 'text-amber-400' : 'text-slate-400'}`}>
                  {language === 'de' ? dueStatus.message_de : dueStatus.message_en}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setView('upload')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {language === 'de' ? 'Neues Blutbild' : 'New Blood Panel'}
          </button>
        </div>

        {/* View tabs */}
        {labResults.length > 0 && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('overview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'overview' || view === 'results'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'de' ? 'Übersicht' : 'Overview'}
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'history'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'de' ? 'Verlauf' : 'History'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Upload View */}
        {view === 'upload' && (
          <BloodCheckUpload
            language={language}
            onUpload={handleUpload}
            onCancel={() => setView(labResults.length > 0 ? 'overview' : 'upload')}
          />
        )}

        {/* Overview / Results View */}
        {(view === 'overview' || view === 'results') && (
          <>
            {labResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔬</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {language === 'de' ? 'Noch keine Blutbilder' : 'No Blood Panels Yet'}
                </h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                  {language === 'de'
                    ? 'Lade dein erstes Blutbild hoch, um personalisierte Empfehlungen zu erhalten.'
                    : 'Upload your first blood panel to get personalized recommendations.'}
                </p>
                <button
                  onClick={() => setView('upload')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
                >
                  {language === 'de' ? 'Blutbild hochladen' : 'Upload Blood Panel'}
                </button>
              </div>
            ) : selectedResult ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {Object.keys(selectedResult.biomarkers || {}).length}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'de' ? 'Biomarker' : 'Biomarkers'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {selectedResult.analysis?.filter(a => a.status === 'optimal').length || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'de' ? 'Optimal' : 'Optimal'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {selectedResult.analysis?.filter(a => a.status !== 'optimal').length || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'de' ? 'Zu optimieren' : 'To optimize'}
                    </p>
                  </div>
                </div>

                {/* Biomarkers */}
                {selectedResult.analysis && selectedResult.analysis.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                      {language === 'de' ? 'Deine Werte' : 'Your Values'}
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.analysis.map((item) => (
                        <BiomarkerCard
                          key={item.code}
                          biomarker={item}
                          language={language}
                          comparison={comparison?.comparison?.find(c => c.code === item.code)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedResult.recommendations && selectedResult.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                      {language === 'de' ? 'Empfehlungen' : 'Recommendations'}
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            rec.priority === 'high'
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-amber-500/10 border-amber-500/30'
                          }`}
                        >
                          <p className={`text-sm ${rec.priority === 'high' ? 'text-red-300' : 'text-amber-300'}`}>
                            {language === 'de' ? rec.text_de : rec.text_en}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {rec.biomarker}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {/* History View */}
        {view === 'history' && (
          <BloodCheckHistory
            results={labResults}
            comparison={comparison}
            language={language}
            onSelectResult={handleSelectResult}
          />
        )}
      </div>
    </div>
  );
}
