import React, { useState } from 'react';
import { SCIENCE_DATA } from '../../utils/scienceData';

/**
 * EvidenceText Component
 * Renders text with clickable science tooltips for keywords
 */
export default function EvidenceText({ text }) {
    const [activeTooltip, setActiveTooltip] = useState(null);

    if (!text) return null;

    // Find all keywords in the text
    const keywords = Object.keys(SCIENCE_DATA);
    const parts = [];
    let lastIndex = 0;

    // Create regex pattern for all keywords
    const pattern = keywords.join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: text.slice(lastIndex, match.index)
            });
        }

        // Add matched keyword
        parts.push({
            type: 'keyword',
            content: match[0],
            key: match[0] // Use matched text to preserve case
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({
            type: 'text',
            content: text.slice(lastIndex)
        });
    }

    return (
        <span className="relative">
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    return <span key={index}>{part.content}</span>;
                }

                // Find the science data (case-insensitive)
                const scienceKey = Object.keys(SCIENCE_DATA).find(
                    k => k.toLowerCase() === part.key.toLowerCase()
                );
                const data = SCIENCE_DATA[scienceKey];

                if (!data) {
                    return <span key={index}>{part.content}</span>;
                }

                return (
                    <span key={index} className="relative inline-block">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltip(activeTooltip === index ? null : index);
                            }}
                            className="border-b border-dashed border-slate-500 hover:border-amber-400 text-slate-200 hover:text-amber-400 transition-colors cursor-help"
                        >
                            {part.content}
                        </button>

                        {activeTooltip === index && (
                            <>
                                {/* Backdrop to close tooltip */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setActiveTooltip(null)}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-72 animate-fadeIn">
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-2xl">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-white text-sm">{scienceKey}</h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveTooltip(null);
                                                }}
                                                className="text-slate-500 hover:text-white transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>

                                        <p className="text-slate-300 text-xs leading-relaxed mb-3">
                                            {data.why}
                                        </p>

                                        <div className="pt-2 border-t border-slate-700">
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                📚 {data.source}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                            <div className="border-8 border-transparent border-t-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </span>
                );
            })}
        </span>
    );
}
