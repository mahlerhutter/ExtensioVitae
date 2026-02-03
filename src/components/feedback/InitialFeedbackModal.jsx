import React, { useState } from 'react';

/**
 * Initial Feedback Modal
 * Shown after plan generation to collect user's first impressions
 */
export default function InitialFeedbackModal({ onSubmit, onSkip }) {
    const [rating, setRating] = useState(0);
    const [whatYouLike, setWhatYouLike] = useState('');
    const [whatToImprove, setWhatToImprove] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                feedback_type: 'initial',
                overall_rating: rating,
                what_you_like: whatYouLike.trim() || null,
                what_to_improve: whatToImprove.trim() || null,
            });
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-slate-900 rounded-xl p-4 sm:p-8 max-w-md w-full border border-slate-800 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">✨</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Wie findest du deinen Plan?
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Dein Feedback hilft uns, bessere Pläne zu erstellen
                    </p>
                </div>

                {/* Star Rating */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                        Gesamtbewertung *
                    </label>
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={(e) => {
                                    // Preview effect
                                    const stars = e.currentTarget.parentElement.children;
                                    for (let i = 0; i < stars.length; i++) {
                                        stars[i].style.transform = i < star ? 'scale(1.2)' : 'scale(1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const stars = e.currentTarget.parentElement.children;
                                    for (let i = 0; i < stars.length; i++) {
                                        stars[i].style.transform = 'scale(1)';
                                    }
                                }}
                                className={`text-4xl transition-all duration-200 ${star <= rating ? 'text-amber-400' : 'text-slate-700 hover:text-slate-600'
                                    }`}
                                disabled={isSubmitting}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-center text-sm text-slate-400 mt-2">
                            {rating === 5 && '🎉 Fantastisch!'}
                            {rating === 4 && '😊 Sehr gut!'}
                            {rating === 3 && '👍 Gut'}
                            {rating === 2 && '😐 Okay'}
                            {rating === 1 && '😕 Verbesserungswürdig'}
                        </p>
                    )}
                </div>

                {/* What you like */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Was gefällt dir am besten? <span className="text-slate-500">(Optional)</span>
                    </label>
                    <textarea
                        value={whatYouLike}
                        onChange={(e) => setWhatYouLike(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="z.B. Die personalisierten Empfehlungen sind super..."
                        disabled={isSubmitting}
                        maxLength={500}
                    />
                    <div className="text-right text-xs text-slate-500 mt-1">
                        {whatYouLike.length}/500
                    </div>
                </div>

                {/* What to improve */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Was würdest du ändern? <span className="text-slate-500">(Optional)</span>
                    </label>
                    <textarea
                        value={whatToImprove}
                        onChange={(e) => setWhatToImprove(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="z.B. Mehr Flexibilität bei den Zeiten..."
                        disabled={isSubmitting}
                        maxLength={500}
                    />
                    <div className="text-right text-xs text-slate-500 mt-1">
                        {whatToImprove.length}/500
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="flex-1 bg-amber-400 text-slate-900 font-semibold py-3 rounded-lg hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-400 flex items-center justify-center gap-2"
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
                            'Feedback senden'
                        )}
                    </button>
                    <button
                        onClick={onSkip}
                        disabled={isSubmitting}
                        className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                    >
                        Überspringen
                    </button>
                </div>

                {/* Helper text */}
                <p className="text-center text-xs text-slate-500 mt-4">
                    Du kannst jederzeit weiteres Feedback über den Feedback-Button geben
                </p>
            </div>
        </div>
    );
}
