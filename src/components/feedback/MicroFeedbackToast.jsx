import React, { useState, useEffect } from 'react';

/**
 * Micro Feedback Toast
 * Quick sentiment check shown after task completion
 */
export default function MicroFeedbackToast({ taskId, dayNumber, onSubmit, onDismiss }) {
    const [helpful, setHelpful] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Slide in animation
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const handleResponse = async (wasHelpful) => {
        setHelpful(wasHelpful);
        setIsSubmitting(true);

        try {
            await onSubmit({
                feedback_type: 'micro',
                task_helpful: wasHelpful,
                task_id: taskId,
                day_number: dayNumber,
            });

            // Auto-dismiss after 1.5 seconds
            setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300); // Wait for fade out animation
            }, 1500);
        } catch (error) {
            console.error('Failed to submit micro feedback:', error);
            setIsSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };

    return (
        <div
            className={`fixed bottom-24 right-6 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl max-w-sm z-40 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
        >
            {helpful === null ? (
                <>
                    {/* Question */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">💭</div>
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm mb-1">
                                War diese Aufgabe hilfreich?
                            </p>
                            <p className="text-slate-400 text-xs">
                                Dein Feedback hilft uns, bessere Aufgaben zu erstellen
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            aria-label="Schließen"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Response Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleResponse(true)}
                            disabled={isSubmitting}
                            className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-sm"
                        >
                            <span className="text-lg">👍</span>
                            Ja
                        </button>
                        <button
                            onClick={() => handleResponse(false)}
                            disabled={isSubmitting}
                            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-sm"
                        >
                            <span className="text-lg">👎</span>
                            Nein
                        </button>
                    </div>
                </>
            ) : (
                /* Thank You Message */
                <div className="flex items-center gap-3">
                    <div className="text-2xl">
                        {helpful ? '✨' : '📝'}
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                            {helpful ? 'Danke für dein Feedback!' : 'Danke! Wir werden das verbessern.'}
                        </p>
                        <p className="text-slate-400 text-xs">
                            {helpful ? 'Weiter so! 💪' : 'Deine Meinung hilft uns sehr.'}
                        </p>
                    </div>
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </div>
    );
}
