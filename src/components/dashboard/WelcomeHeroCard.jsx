import React from 'react';
import { Sparkles, Target, BookOpen, TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * Welcome Hero Card - Day 1 Experience
 *
 * Shows new users:
 * - Welcome message with value prop
 * - Quick Win CTA
 * - Progress Milestones
 * - What makes ExtensioVitae unique
 */
export default function WelcomeHeroCard({ userName, onQuickWinClick, milestones = {} }) {
    const completedMilestones = Object.values(milestones).filter(Boolean).length;
    const totalMilestones = 5;
    const progress = (completedMilestones / totalMilestones) * 100;

    // Don't show if user has completed onboarding
    if (completedMilestones >= totalMilestones) return null;

    return (
        <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl p-8 mb-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-6 h-6 text-white" />
                            <span className="text-white/80 text-sm font-medium">Willkommen bei ExtensioVitae</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Hi {userName}! 👋
                        </h1>
                        <p className="text-white/90 text-lg max-w-2xl">
                            Dein personalisiertes <span className="font-semibold">Operating System für Langlebigkeit</span> ist bereit.
                            Wir zeigen dir jeden Tag genau <span className="font-semibold">eine Sache</span>, die JETZT am wichtigsten ist.
                        </p>
                    </div>
                </div>

                {/* Value Props Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <Target className="w-5 h-5 text-white mb-2" />
                        <h3 className="text-white font-semibold text-sm mb-1">Zero Mental Overhead</h3>
                        <p className="text-white/80 text-xs">
                            Eine klare Empfehlung statt 50 Optionen. Wir entscheiden für dich.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <BookOpen className="w-5 h-5 text-white mb-2" />
                        <h3 className="text-white font-semibold text-sm mb-1">Science-Backed</h3>
                        <p className="text-white/80 text-xs">
                            Basiert auf 12+ peer-reviewed Studien. Keine Trends, nur Evidenz.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <TrendingUp className="w-5 h-5 text-white mb-2" />
                        <h3 className="text-white font-semibold text-sm mb-1">+5-15 Jahre</h3>
                        <p className="text-white/80 text-xs">
                            Gesunde Lebensspanne. Messbar, nachweisbar, erreichbar.
                        </p>
                    </div>
                </div>

                {/* Quick Win CTA */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">
                                🎯 Dein erster Quick Win
                            </h3>
                            <p className="text-white/80 text-sm">
                                Wir haben dein Protokoll analysiert. Dies ist der optimale erste Schritt für dich.
                            </p>
                        </div>
                        <button
                            onClick={onQuickWinClick}
                            className="ml-4 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            Jetzt starten →
                        </button>
                    </div>
                </div>

                {/* Milestones Progress */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold text-sm">Onboarding Fortschritt</h4>
                        <span className="text-white/80 text-xs">{completedMilestones}/{totalMilestones} abgeschlossen</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                            className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Milestones List */}
                    <div className="space-y-2">
                        <Milestone
                            completed={milestones.firstTask}
                            text="Erste Task abgeschlossen"
                        />
                        <Milestone
                            completed={milestones.morningCheckIn}
                            text="Morning Check-in gemacht"
                        />
                        <Milestone
                            completed={milestones.threeDayStreak}
                            text="3-Tage Streak erreicht"
                        />
                        <Milestone
                            completed={milestones.moduleActivated}
                            text="Erstes Modul aktiviert"
                        />
                        <Milestone
                            completed={milestones.weekComplete}
                            text="Erste Woche completed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Milestone({ completed, text }) {
    return (
        <div className="flex items-center gap-2">
            {completed ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/40"></div>
            )}
            <span className={`text-sm ${completed ? 'text-white font-medium' : 'text-white/60'}`}>
                {text}
            </span>
        </div>
    );
}
