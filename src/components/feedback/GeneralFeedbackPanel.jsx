import React, { useState } from 'react';
import { useToast } from '../Toast';

/**
 * General Feedback Panel
 * Slide-in panel for general feedback, bug reports, and feature requests
 */
export default function GeneralFeedbackPanel({ onClose, onSubmit }) {
    const [feedbackType, setFeedbackType] = useState('general');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                feedback_type: feedbackType,
                general_comment: comment.trim(),
            });
            addToast('Feedback erfolgreich gesendet! Vielen Dank 🎉', 'success');
            setComment('');
            onClose();
        } catch (error) {
            console.error('Failed to submit feedback:', error);

            // Show user-friendly error message
            let errorMessage = 'Fehler beim Senden des Feedbacks.';

            if (error.message?.includes('not authenticated')) {
                errorMessage = 'Bitte melde dich an, um Feedback zu senden.';
            } else if (error.message?.includes('policy')) {
                errorMessage = 'Keine Berechtigung. Bitte versuche dich neu anzumelden.';
            } else if (error.code === 'PGRST301') {
                errorMessage = 'Datenbankfehler. Bitte kontaktiere den Support.';
            }

            addToast(errorMessage + ' Fehlerdetails: ' + (error.message || 'Unbekannt'), 'error');
            setIsSubmitting(false);
        }
    };

    const feedbackTypes = [
        { value: 'general', label: '💬 Allgemeines Feedback', icon: '💬' },
        { value: 'bug', label: '🐛 Bug melden', icon: '🐛' },
        { value: 'feature', label: '✨ Feature-Wunsch', icon: '✨' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slideInRight">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Feedback</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                            aria-label="Schließen"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Deine Meinung ist uns wichtig! Teile dein Feedback, melde Bugs oder schlage neue Features vor.
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Feedback Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Was möchtest du uns mitteilen?
                        </label>
                        <div className="space-y-2">
                            {feedbackTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setFeedbackType(type.value)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${feedbackType === type.value
                                        ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                        }`}
                                    disabled={isSubmitting}
                                >
                                    <span className="text-xl mr-3">{type.icon}</span>
                                    <span className="font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Dein Feedback
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                            rows={8}
                            placeholder={
                                feedbackType === 'bug'
                                    ? 'Beschreibe den Bug so detailliert wie möglich...'
                                    : feedbackType === 'feature'
                                        ? 'Welches Feature würdest du dir wünschen?'
                                        : 'Teile uns deine Gedanken mit...'
                            }
                            disabled={isSubmitting}
                            maxLength={1000}
                        />
                        <div className="text-right text-xs text-slate-500 mt-1">
                            {comment.length}/1000
                        </div>
                    </div>

                    {/* Helper Tips */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <p className="text-sm text-slate-400 mb-2">
                            <span className="font-semibold text-slate-300">💡 Tipp:</span>
                        </p>
                        <ul className="text-xs text-slate-500 space-y-1 ml-4 list-disc">
                            {feedbackType === 'bug' && (
                                <>
                                    <li>Beschreibe, was du getan hast</li>
                                    <li>Was hast du erwartet?</li>
                                    <li>Was ist stattdessen passiert?</li>
                                </>
                            )}
                            {feedbackType === 'feature' && (
                                <>
                                    <li>Welches Problem würde es lösen?</li>
                                    <li>Wie würdest du es nutzen?</li>
                                    <li>Gibt es Beispiele aus anderen Apps?</li>
                                </>
                            )}
                            {feedbackType === 'general' && (
                                <>
                                    <li>Sei so konkret wie möglich</li>
                                    <li>Positives und Negatives ist willkommen</li>
                                    <li>Wir lesen jedes Feedback</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={handleSubmit}
                        disabled={!comment.trim() || isSubmitting}
                        className="w-full bg-amber-400 text-slate-900 font-semibold py-3 rounded-lg hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-400 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Wird gesendet...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span>Feedback senden</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
