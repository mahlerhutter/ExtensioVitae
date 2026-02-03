import React from 'react';

/**
 * Floating Feedback Button
 * Always-available button for users to provide feedback
 */
export default function FloatingFeedbackButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-amber-400 text-slate-900 font-semibold px-4 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-lg hover:bg-amber-300 transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2 z-40 group"
            aria-label="Feedback geben"
        >
            <svg
                className="w-5 h-5 transition-transform group-hover:rotate-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
            </svg>
            <span className="hidden sm:inline">Feedback</span>
        </button>
    );
}
