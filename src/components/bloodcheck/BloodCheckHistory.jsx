import React from 'react';

/**
 * Blood Check History Component
 *
 * Displays history of lab results with comparison capabilities.
 */
export default function BloodCheckHistory({ results, language = 'de', onSelect }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-400">
          {language === 'de'
            ? 'Noch keine Blutbilder vorhanden'
            : 'No blood panels yet'}
        </p>
      </div>
    );
  }

  // Sort by date descending
  const sortedResults = [...results].sort((a, b) =>
    new Date(b.lab_date || b.created_at) - new Date(a.lab_date || a.created_at)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      parsed: { de: 'Analysiert', en: 'Analyzed' },
      pending: { de: 'Ausstehend', en: 'Pending' },
      failed: { de: 'Fehlgeschlagen', en: 'Failed' }
    };
    return labels[status]?.[language] || status;
  };

  const getBiomarkerCount = (result) => {
    if (!result.biomarkers) return 0;
    return Object.keys(result.biomarkers).length;
  };

  const getDeficiencyCount = (result) => {
    if (!result.deficiencies) return 0;
    return result.deficiencies.length;
  };

  const getConfidenceLabel = (confidence) => {
    if (!confidence) return null;
    if (confidence >= 80) return { label: language === 'de' ? 'Hoch' : 'High', color: 'text-green-400' };
    if (confidence >= 50) return { label: language === 'de' ? 'Mittel' : 'Medium', color: 'text-yellow-400' };
    return { label: language === 'de' ? 'Niedrig' : 'Low', color: 'text-red-400' };
  };

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          {language === 'de' ? 'Verlauf' : 'History'}
        </h3>
        <span className="text-sm text-slate-400">
          {sortedResults.length} {language === 'de' ? 'Einträge' : 'entries'}
        </span>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {sortedResults.map((result, index) => {
          const biomarkerCount = getBiomarkerCount(result);
          const deficiencyCount = getDeficiencyCount(result);
          const confidenceInfo = getConfidenceLabel(result.ocr_confidence);

          return (
            <div
              key={result.id}
              onClick={() => onSelect?.(result)}
              className={`p-4 rounded-xl bg-slate-800/50 border transition-all cursor-pointer ${
                index === 0
                  ? 'border-amber-500/50 hover:border-amber-500'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Date and Status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {formatDate(result.lab_date || result.created_at)}
                    </span>
                    {index === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {language === 'de' ? 'Aktuell' : 'Latest'}
                      </span>
                    )}
                  </div>
                  {result.lab_provider && (
                    <p className="text-sm text-slate-400 mt-0.5">{result.lab_provider}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(result.parsing_status)}`}>
                  {getStatusLabel(result.parsing_status)}
                </span>
              </div>

              {/* Stats */}
              {result.parsing_status === 'parsed' && (
                <div className="grid grid-cols-3 gap-3">
                  {/* Biomarkers */}
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    <div className="text-lg font-bold text-white">{biomarkerCount}</div>
                    <div className="text-xs text-slate-400">
                      {language === 'de' ? 'Marker' : 'Markers'}
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    <div className={`text-lg font-bold ${deficiencyCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {deficiencyCount}
                    </div>
                    <div className="text-xs text-slate-400">
                      {language === 'de' ? 'Auffällig' : 'Issues'}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    {confidenceInfo ? (
                      <>
                        <div className={`text-lg font-bold ${confidenceInfo.color}`}>
                          {result.ocr_confidence}%
                        </div>
                        <div className="text-xs text-slate-400">
                          {language === 'de' ? 'Genauigkeit' : 'Accuracy'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-slate-500">-</div>
                        <div className="text-xs text-slate-400">
                          {language === 'de' ? 'Genauigkeit' : 'Accuracy'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Failed status message */}
              {result.parsing_status === 'failed' && result.parsing_errors?.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">
                    {result.parsing_errors[0]?.message || (language === 'de' ? 'Analyse fehlgeschlagen' : 'Analysis failed')}
                  </p>
                </div>
              )}

              {/* Pending status */}
              {result.parsing_status === 'pending' && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">
                    {language === 'de' ? 'Wird analysiert...' : 'Analyzing...'}
                  </span>
                </div>
              )}

              {/* Key findings preview */}
              {result.deficiencies?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {result.deficiencies.slice(0, 3).map((def, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded-full ${
                          def.status === 'low' || def.status === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {def.name_de || def.code} {def.status === 'low' || def.status === 'suboptimal_low' ? '↓' : '↑'}
                      </span>
                    ))}
                    {result.deficiencies.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-400">
                        +{result.deficiencies.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison hint */}
      {sortedResults.length >= 2 && (
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-sm text-slate-400 text-center">
            💡 {language === 'de'
              ? 'Tippe auf ein Blutbild zum Vergleichen'
              : 'Tap a blood panel to compare'}
          </p>
        </div>
      )}
    </div>
  );
}
