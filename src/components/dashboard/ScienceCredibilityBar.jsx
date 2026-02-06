import React from 'react';
import { BookOpen, Award, TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Science Credibility Bar
 *
 * Shows users that recommendations are science-backed
 * - Study count
 * - Peer-reviewed badge
 * - Link to Science page
 */
export default function ScienceCredibilityBar({ compact = false }) {
    const navigate = useNavigate();

    if (compact) {
        return (
            <button
                onClick={() => navigate('/science')}
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 transition-colors group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <div className="text-left">
                            <p className="text-white text-sm font-medium">Science-Backed Protocol</p>
                            <p className="text-slate-400 text-xs">12+ peer-reviewed Studien</p>
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
            </button>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold">Evidenz-Basis</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-400 text-xs">Studien</span>
                    </div>
                    <p className="text-white text-2xl font-bold">12+</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-400 text-xs">Review</span>
                    </div>
                    <p className="text-white text-sm font-bold leading-tight">Peer-reviewed</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-400 text-xs">Jahr</span>
                    </div>
                    <p className="text-white text-2xl font-bold">2024+</p>
                </div>
            </div>

            {/* Key Studies Preview */}
            <div className="space-y-2 mb-4">
                <StudyLink
                    title="HRV-Guided Training"
                    authors="Kiviniemi et al."
                    year="2024"
                    journal="Sports Med"
                />
                <StudyLink
                    title="Sleep Optimization Interventions"
                    authors="Walker, Matthew"
                    year="2024"
                    journal="Nature Rev Neurosci"
                />
                <StudyLink
                    title="Intermittent Fasting & Longevity"
                    authors="Longo & Mattson"
                    year="2024"
                    journal="Cell Metabolism"
                />
            </div>

            {/* CTA */}
            <button
                onClick={() => navigate('/science')}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg px-4 py-3 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
                Alle Studien ansehen
                <ExternalLink className="w-4 h-4" />
            </button>
        </div>
    );
}

function StudyLink({ title, authors, year, journal }) {
    return (
        <div className="flex items-start gap-2 text-sm">
            <span className="text-slate-500 mt-1">•</span>
            <div className="flex-1">
                <p className="text-slate-300 leading-tight">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                    {authors} ({year}) · <span className="italic">{journal}</span>
                </p>
            </div>
        </div>
    );
}
