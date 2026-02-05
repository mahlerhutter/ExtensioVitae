import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './BiomarkerResultsCard.css';

/**
 * BiomarkerResultsCard Component
 * 
 * Displays biomarker results with color-coded status indicators.
 * Shows reference ranges, trends, and actionable recommendations.
 * 
 * Part of Lab Snapshot Lite (Score: 12)
 */

const BIOMARKER_DISPLAY_NAMES = {
    vitamin_d: 'Vitamin D (25-OH)',
    vitamin_b12: 'Vitamin B12',
    ferritin: 'Ferritin',
    tsh: 'TSH',
    hba1c: 'HbA1c',
    total_cholesterol: 'Total Cholesterol',
    triglycerides: 'Triglycerides',
    crp: 'CRP',
    glucose_fasting: 'Fasting Glucose',
    creatinine: 'Creatinine'
};

const STATUS_CONFIG = {
    optimal: {
        icon: '🟢',
        label: 'Optimal',
        color: '#10b981',
        bgColor: '#d1fae5'
    },
    borderline: {
        icon: '🟡',
        label: 'Borderline',
        color: '#f59e0b',
        bgColor: '#fef3c7'
    },
    low: {
        icon: '🔵',
        label: 'Low',
        color: '#3b82f6',
        bgColor: '#dbeafe'
    },
    high: {
        icon: '🔴',
        label: 'High',
        color: '#ef4444',
        bgColor: '#fee2e2'
    },
    critical: {
        icon: '⚠️',
        label: 'Critical',
        color: '#dc2626',
        bgColor: '#fecaca'
    }
};

const RECOMMENDATIONS = {
    vitamin_d: {
        low: 'Supplement with 5000 IU/day. Get 15-20 min sun exposure daily.',
        high: 'Reduce supplementation. Consult physician if >100 ng/ml.'
    },
    vitamin_b12: {
        low: 'Consider B12 supplementation (1000 mcg/day). Check for absorption issues.',
        high: 'Usually not concerning. Excess B12 is water-soluble.'
    },
    ferritin: {
        low: 'Increase iron-rich foods (red meat, spinach). Consider iron supplement.',
        high: 'Check for inflammation or hemochromatosis. Reduce iron intake.'
    },
    tsh: {
        low: 'Possible hyperthyroidism. Consult endocrinologist.',
        high: 'Possible hypothyroidism. Consult endocrinologist.'
    },
    hba1c: {
        low: 'Monitor for hypoglycemia. Ensure adequate carb intake.',
        high: 'Prediabetes/Diabetes risk. Reduce carbs, increase exercise.'
    },
    total_cholesterol: {
        low: 'Usually not concerning. Ensure adequate fat intake.',
        high: 'Consider Mediterranean diet. Increase fiber, reduce saturated fats.'
    },
    triglycerides: {
        low: 'Usually not concerning.',
        high: 'Reduce sugar and alcohol. Increase omega-3 fatty acids.'
    },
    crp: {
        low: 'Good! Low inflammation.',
        high: 'Inflammation detected. Reduce processed foods, increase anti-inflammatory foods.'
    },
    glucose_fasting: {
        low: 'Monitor for hypoglycemia. Adjust diet timing.',
        high: 'Prediabetes risk. Reduce carbs, especially refined sugars.'
    },
    creatinine: {
        low: 'Usually not concerning.',
        high: 'Check kidney function. Stay hydrated, reduce protein if elevated.'
    }
};

export default function BiomarkerResultsCard() {
    const { user } = useAuth();
    const [biomarkers, setBiomarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBiomarker, setSelectedBiomarker] = useState(null);

    useEffect(() => {
        if (user) {
            fetchBiomarkers();
        }
    }, [user]);

    async function fetchBiomarkers() {
        try {
            setLoading(true);
            setError(null);

            // Fetch latest biomarker results
            const { data, error: fetchError } = await supabase
                .from('biomarker_results')
                .select('*')
                .eq('user_id', user.id)
                .order('test_date', { ascending: false });

            if (fetchError) throw fetchError;

            // Group by biomarker name and get latest
            const latestBiomarkers = {};
            data.forEach(result => {
                if (!latestBiomarkers[result.biomarker_name] ||
                    new Date(result.test_date) > new Date(latestBiomarkers[result.biomarker_name].test_date)) {
                    latestBiomarkers[result.biomarker_name] = result;
                }
            });

            setBiomarkers(Object.values(latestBiomarkers));
        } catch (err) {
            console.error('Error fetching biomarkers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function getRecommendation(biomarker) {
        const recs = RECOMMENDATIONS[biomarker.biomarker_name];
        if (!recs) return null;

        if (biomarker.status === 'low' || biomarker.status === 'critical') {
            return recs.low;
        } else if (biomarker.status === 'high') {
            return recs.high;
        }
        return null;
    }

    function formatValue(value, unit) {
        return `${parseFloat(value).toFixed(2)} ${unit}`;
    }

    function formatReferenceRange(biomarker) {
        if (biomarker.reference_range_text) {
            return biomarker.reference_range_text;
        }
        if (biomarker.reference_min && biomarker.reference_max) {
            return `${biomarker.reference_min}-${biomarker.reference_max} ${biomarker.unit}`;
        }
        return 'Not available';
    }

    function formatOptimalRange(biomarker) {
        if (biomarker.optimal_min && biomarker.optimal_max) {
            return `${biomarker.optimal_min}-${biomarker.optimal_max} ${biomarker.unit}`;
        }
        return null;
    }

    if (loading) {
        return (
            <div className="biomarker-card">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading biomarker results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="biomarker-card">
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <p>Error loading biomarkers: {error}</p>
                    <button onClick={fetchBiomarkers} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (biomarkers.length === 0) {
        return (
            <div className="biomarker-card">
                <div className="empty-state">
                    <span className="empty-icon">🧪</span>
                    <h3>No Lab Results Yet</h3>
                    <p>Upload your first lab report to track biomarkers.</p>
                    <button className="upload-button">
                        Upload Lab Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="biomarker-card">
            <div className="biomarker-header">
                <h2>🧪 Lab Results</h2>
                <button onClick={fetchBiomarkers} className="refresh-button">
                    🔄 Refresh
                </button>
            </div>

            <div className="biomarker-grid">
                {biomarkers.map(biomarker => {
                    const statusConfig = STATUS_CONFIG[biomarker.status] || STATUS_CONFIG.borderline;
                    const displayName = BIOMARKER_DISPLAY_NAMES[biomarker.biomarker_name] || biomarker.biomarker_name;
                    const recommendation = getRecommendation(biomarker);
                    const optimalRange = formatOptimalRange(biomarker);

                    return (
                        <div
                            key={biomarker.id}
                            className="biomarker-item"
                            onClick={() => setSelectedBiomarker(biomarker)}
                            style={{ borderLeft: `4px solid ${statusConfig.color}` }}
                        >
                            <div className="biomarker-item-header">
                                <div className="biomarker-name">
                                    <span className="status-icon">{statusConfig.icon}</span>
                                    <span className="name-text">{displayName}</span>
                                </div>
                                <span
                                    className="status-badge"
                                    style={{
                                        backgroundColor: statusConfig.bgColor,
                                        color: statusConfig.color
                                    }}
                                >
                                    {statusConfig.label}
                                </span>
                            </div>

                            <div className="biomarker-value">
                                <span className="value-number">
                                    {formatValue(biomarker.value, biomarker.unit)}
                                </span>
                            </div>

                            <div className="biomarker-ranges">
                                <div className="range-item">
                                    <span className="range-label">Reference:</span>
                                    <span className="range-value">{formatReferenceRange(biomarker)}</span>
                                </div>
                                {optimalRange && (
                                    <div className="range-item optimal">
                                        <span className="range-label">Optimal:</span>
                                        <span className="range-value">{optimalRange}</span>
                                    </div>
                                )}
                            </div>

                            {recommendation && (
                                <div className="biomarker-recommendation">
                                    <span className="rec-icon">💡</span>
                                    <span className="rec-text">{recommendation}</span>
                                </div>
                            )}

                            <div className="biomarker-meta">
                                <span className="test-date">
                                    📅 {new Date(biomarker.test_date).toLocaleDateString()}
                                </span>
                                {biomarker.lab_name && (
                                    <span className="lab-name">🏥 {biomarker.lab_name}</span>
                                )}
                            </div>

                            {biomarker.ocr_confidence && biomarker.ocr_confidence < 0.9 && (
                                <div className="confidence-warning">
                                    ⚠️ OCR Confidence: {Math.round(biomarker.ocr_confidence * 100)}%
                                    {!biomarker.manually_verified && ' - Please verify'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedBiomarker && (
                <BiomarkerDetailModal
                    biomarker={selectedBiomarker}
                    onClose={() => setSelectedBiomarker(null)}
                />
            )}
        </div>
    );
}

function BiomarkerDetailModal({ biomarker, onClose }) {
    const statusConfig = STATUS_CONFIG[biomarker.status] || STATUS_CONFIG.borderline;
    const displayName = BIOMARKER_DISPLAY_NAMES[biomarker.biomarker_name] || biomarker.biomarker_name;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{displayName}</h3>
                    <button onClick={onClose} className="close-button">✕</button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <h4>Current Value</h4>
                        <div className="current-value" style={{ color: statusConfig.color }}>
                            {statusConfig.icon} {biomarker.value} {biomarker.unit}
                            <span className="status-text">({statusConfig.label})</span>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Reference Ranges</h4>
                        <table className="ranges-table">
                            <tbody>
                                <tr>
                                    <td>Lab Reference:</td>
                                    <td>{biomarker.reference_range_text || `${biomarker.reference_min}-${biomarker.reference_max} ${biomarker.unit}`}</td>
                                </tr>
                                {biomarker.optimal_min && biomarker.optimal_max && (
                                    <tr className="optimal-row">
                                        <td>Optimal Range:</td>
                                        <td>{biomarker.optimal_min}-{biomarker.optimal_max} {biomarker.unit}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="detail-section">
                        <h4>Test Information</h4>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td>Test Date:</td>
                                    <td>{new Date(biomarker.test_date).toLocaleDateString('de-DE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</td>
                                </tr>
                                {biomarker.lab_name && (
                                    <tr>
                                        <td>Lab:</td>
                                        <td>{biomarker.lab_name}</td>
                                    </tr>
                                )}
                                {biomarker.test_method && (
                                    <tr>
                                        <td>Method:</td>
                                        <td>{biomarker.test_method}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {biomarker.notes && (
                        <div className="detail-section">
                            <h4>Notes</h4>
                            <p className="notes-text">{biomarker.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
