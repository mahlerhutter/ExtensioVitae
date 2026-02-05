import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import recoveryService from '../../lib/recoveryService';
import './MorningCheckIn.css';

/**
 * MorningCheckIn Component
 * 
 * 3-question morning check-in modal for recovery score calculation.
 * Displays on first dashboard visit of the day.
 * 
 * Questions:
 * 1. How many hours did you sleep? (4-10h slider)
 * 2. How often did you wake up? (0 / 1-2 / 3+)
 * 3. How do you feel? (😴 😐 ⚡)
 * 
 * Part of Recovery Score & Auto-Swap (Score: 15)
 */

const FEELING_OPTIONS = [
    { value: 'exhausted', emoji: '😴', label: 'Exhausted' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'energized', emoji: '⚡', label: 'Energized' }
];

const WAKEUP_OPTIONS = [
    { value: 0, label: 'None', description: '0 times' },
    { value: 1, label: 'Few', description: '1-2 times' },
    { value: 3, label: 'Many', description: '3+ times' }
];

export default function MorningCheckIn({ onComplete, onSkip, showModal: externalShowModal }) {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [sleepHours, setSleepHours] = useState(7);
    const [wakeUps, setWakeUps] = useState(0);
    const [feeling, setFeeling] = useState('neutral');

    // Result state
    const [recoveryResult, setRecoveryResult] = useState(null);

    // Use external showModal if provided, otherwise check automatically
    useEffect(() => {
        if (externalShowModal !== undefined) {
            setShowModal(externalShowModal);
        } else if (user) {
            checkIfNeedsCheckIn();
        }
    }, [user, externalShowModal]);

    async function checkIfNeedsCheckIn() {
        if (!user) return;

        try {
            const todayScore = await recoveryService.getTodayRecoveryScore(supabase, user.id);

            if (!todayScore) {
                // No score for today - show modal
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error checking recovery score:', error);
        }
    }

    async function handleSubmit() {
        setLoading(true);

        try {
            // Calculate recovery score
            const result = recoveryService.calculateRecoveryScore({
                sleepHours,
                wakeUps,
                feeling
            });

            // Save to database
            await recoveryService.saveRecoveryScore(supabase, user.id, result);

            setRecoveryResult(result);
            setStep(4); // Show results

            // Notify parent component
            if (onComplete) {
                onComplete(result);
            }
        } catch (error) {
            console.error('Error saving recovery score:', error);
            alert('Failed to save recovery score. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleSkip() {
        setShowModal(false);
        if (onSkip) {
            onSkip();
        }
    }

    function handleClose() {
        setShowModal(false);
        if (recoveryResult && onComplete) {
            onComplete(recoveryResult);
        }
    }

    if (!showModal) return null;

    return (
        <div className="morning-checkin-overlay">
            <div className="morning-checkin-modal">
                {step < 4 && (
                    <div className="modal-header">
                        <h2>☀️ Good Morning!</h2>
                        <p>Quick 3-question check-in to optimize your day</p>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="modal-body">
                    {step === 1 && (
                        <div className="question-step">
                            <div className="question-icon">😴</div>
                            <h3>How many hours did you sleep?</h3>
                            <div className="sleep-slider-container">
                                <div className="sleep-value">{sleepHours}h</div>
                                <input
                                    type="range"
                                    min="4"
                                    max="10"
                                    step="0.5"
                                    value={sleepHours}
                                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                                    className="sleep-slider"
                                />
                                <div className="slider-labels">
                                    <span>4h</span>
                                    <span>7h</span>
                                    <span>10h</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="next-button"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="question-step">
                            <div className="question-icon">🌙</div>
                            <h3>How often did you wake up during the night?</h3>
                            <div className="wakeup-options">
                                {WAKEUP_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setWakeUps(option.value)}
                                        className={`wakeup-option ${wakeUps === option.value ? 'selected' : ''}`}
                                    >
                                        <div className="option-label">{option.label}</div>
                                        <div className="option-description">{option.description}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="button-group">
                                <button onClick={() => setStep(1)} className="back-button">
                                    ← Back
                                </button>
                                <button onClick={() => setStep(3)} className="next-button">
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="question-step">
                            <div className="question-icon">💪</div>
                            <h3>How do you feel right now?</h3>
                            <div className="feeling-options">
                                {FEELING_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFeeling(option.value)}
                                        className={`feeling-option ${feeling === option.value ? 'selected' : ''}`}
                                    >
                                        <div className="feeling-emoji">{option.emoji}</div>
                                        <div className="feeling-label">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="button-group">
                                <button onClick={() => setStep(2)} className="back-button">
                                    ← Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Calculating...' : 'Calculate Score 🎯'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && recoveryResult && (
                        <div className="results-step">
                            <RecoveryScoreDisplay result={recoveryResult} />
                            <button onClick={handleClose} className="close-button-large">
                                Got it! 👍
                            </button>
                        </div>
                    )}
                </div>

                {step < 4 && (
                    <div className="modal-footer">
                        <button onClick={handleSkip} className="skip-button">
                            Skip for today
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function RecoveryScoreDisplay({ result }) {
    const { score, level, breakdown, recommendations, shouldSwapIntensity } = result;

    const levelConfig = {
        excellent: { color: '#10b981', emoji: '🌟', message: 'Excellent recovery!' },
        good: { color: '#3b82f6', emoji: '👍', message: 'Good recovery' },
        moderate: { color: '#f59e0b', emoji: '😐', message: 'Moderate recovery' },
        poor: { color: '#ef4444', emoji: '😴', message: 'Poor recovery' }
    };

    const config = levelConfig[level] || levelConfig.moderate;

    return (
        <div className="recovery-score-display">
            <div className="score-circle" style={{ borderColor: config.color }}>
                <div className="score-emoji">{config.emoji}</div>
                <div className="score-number" style={{ color: config.color }}>
                    {score}
                </div>
                <div className="score-label">Recovery Score</div>
            </div>

            <div className="score-message" style={{ color: config.color }}>
                {config.message}
            </div>

            <div className="score-breakdown">
                <h4>Breakdown</h4>
                <div className="breakdown-item">
                    <span className="breakdown-label">😴 Sleep Duration</span>
                    <span className="breakdown-value">{breakdown.sleepScore}/40</span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">🌙 Sleep Quality</span>
                    <span className="breakdown-value">{breakdown.qualityScore}/30</span>
                </div>
                <div className="breakdown-item">
                    <span className="breakdown-label">⚡ Energy Level</span>
                    <span className="breakdown-value">{breakdown.feelingScore}/30</span>
                </div>
            </div>

            {shouldSwapIntensity && (
                <div className="swap-alert">
                    <div className="swap-icon">🔄</div>
                    <div className="swap-content">
                        <h4>Auto-Swap Activated</h4>
                        <p>Your recovery is low. High-intensity tasks will be swapped to recovery activities:</p>
                        <ul>
                            <li>HIIT → Yoga Nidra</li>
                            <li>Heavy Lifting → Light Stretching</li>
                            <li>Sprints → Walking</li>
                        </ul>
                    </div>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="recommendations">
                    <h4>💡 Recommendations</h4>
                    {recommendations.map((rec, index) => (
                        <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                            <div className="rec-message">{rec.message}</div>
                            {rec.action && (
                                <div className="rec-action">→ {rec.action}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Compact version for dashboard display
export function RecoveryScoreWidget() {
    const { user } = useAuth();
    const [todayScore, setTodayScore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTodayScore();
        }
    }, [user]);

    async function fetchTodayScore() {
        try {
            const score = await recoveryService.getTodayRecoveryScore(supabase, user.id);
            setTodayScore(score);
        } catch (error) {
            console.error('Error fetching recovery score:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="recovery-widget loading">Loading...</div>;
    }

    if (!todayScore) {
        return (
            <div className="recovery-widget empty">
                <span className="widget-icon">☀️</span>
                <span className="widget-text">Complete morning check-in</span>
            </div>
        );
    }

    const levelColors = {
        excellent: '#10b981',
        good: '#3b82f6',
        moderate: '#f59e0b',
        poor: '#ef4444'
    };

    return (
        <div className="recovery-widget" style={{ borderLeftColor: levelColors[todayScore.level] }}>
            <div className="widget-score">{todayScore.score}</div>
            <div className="widget-details">
                <div className="widget-label">Recovery Score</div>
                <div className="widget-level" style={{ color: levelColors[todayScore.level] }}>
                    {todayScore.level}
                </div>
            </div>
        </div>
    );
}
