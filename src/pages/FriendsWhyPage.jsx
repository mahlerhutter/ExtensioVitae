import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Zap, TrendingUp, Heart, Brain, Activity } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function FriendsWhyPage() {
    useDocumentTitle('Product Overview - ExtensioVitae');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
            <DashboardHeader />

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/friends')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Zurück zu Friends & Family</span>
                </button>

                {/* Hero Section */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-12 text-white shadow-2xl mb-12">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold mb-4">Was ist ExtensioVitae?</h1>
                        <p className="text-xl text-blue-100 leading-relaxed">
                            Ein wissenschaftsbasiertes Longevity-Betriebssystem, das personalisierte 30-Tage-Protokolle generiert
                            und dich durch evidenzbasierte Gewohnheiten führt — optimiert für maximale Lebensspanne und Healthspan.
                        </p>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">18</div>
                        <div className="text-sm text-gray-600">Implementierte Features</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">74%</div>
                        <div className="text-sm text-gray-600">Task Completion Rate</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">+5-15</div>
                        <div className="text-sm text-gray-600">Jahre Lebensspanne</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="text-3xl font-bold text-purple-600 mb-2">9</div>
                        <div className="text-sm text-gray-600">Edge Functions</div>
                    </div>
                </div>

                {/* Core Pillars */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Die 6 Säulen der Langlebigkeit</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">😴</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Sleep</h3>
                                    <p className="text-sm text-gray-600">
                                        Schlafqualität, Erholung, Licht-Exposition, Schlafhygiene. Optimiert durch HRV-Tracking und circadiane Rhythmus-Intelligenz.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🏃</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Movement</h3>
                                    <p className="text-sm text-gray-600">
                                        Sport, Training, Wandern, Krafttraining, Dehnen. Smart Log AI klassifiziert automatisch Intensität und Dauer.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🥗</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Nutrition</h3>
                                    <p className="text-sm text-gray-600">
                                        Essen, Trinken, Supplements, Fasten. Evidenzbasierte Empfehlungen mit wissenschaftlichen Quellen.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🧘</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Stress</h3>
                                    <p className="text-sm text-gray-600">
                                        Meditation, Breathwork, Entspannung, Journaling. Integriert mit HRV-Daten für personalisierte Empfehlungen.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">❤️</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Connection</h3>
                                    <p className="text-sm text-gray-600">
                                        Soziale Kontakte, Familie, Freunde, Community. Dual-Pillar Tracking für soziale Aktivitäten.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🌍</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Environment</h3>
                                    <p className="text-sm text-gray-600">
                                        Sauna, Kälteexposition, Luftqualität, Toxin-Vermeidung, Sonnenlicht. Umgebungsfaktoren für Langlebigkeit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Was macht ExtensioVitae einzigartig?</h2>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                            <div className="flex items-start gap-4">
                                <Zap className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Smart Log - AI Activity Tracking</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        Natürliche Spracheingabe → AI-Klassifizierung → Strukturierte Longevity-Daten.
                                        "1h joggen im Park" wird automatisch als Movement, 60min, medium, outdoor klassifiziert.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">OpenAI GPT-4o-mini</span>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Dual-Pillar Support</span>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Real-time Classification</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-start gap-4">
                                <Activity className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Wearable Integration (Oura, WHOOP)</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        HRV, Ruhepuls, Schlafqualität → Personalisierte Task-Empfehlungen.
                                        Recovery Dashboard zeigt deinen biologischen Status in Echtzeit.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">OAuth 2.0</span>
                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">8 Edge Functions</span>
                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Partitioned Tables</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                            <div className="flex items-start gap-4">
                                <Brain className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Evidenzbasierte Protokolle</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        Jede Empfehlung ist mit wissenschaftlichen Quellen verlinkt.
                                        Longevity Score basiert auf peer-reviewed Research zu Lebensspanne-Verlängerung.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">PubMed Citations</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Evidence Tooltips</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Science-backed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                            <div className="flex items-start gap-4">
                                <Target className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Personalisierte 30-Tage-Protokolle</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        AI-generierte Pläne basierend auf deinem Intake: Alter, Schlafqualität, Stress-Level, Ernährung, Bewegung.
                                        Optimiert für deine spezifischen Schwachstellen.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">GPT-4 Turbo</span>
                                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">Circadian Optimization</span>
                                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">Daily Tracking</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Impact Numbers */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-12">
                    <h2 className="text-2xl font-bold mb-6">Impact & Zahlen</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-4xl font-bold mb-2">74%</div>
                            <div className="text-sm text-purple-100">Task Completion Rate</div>
                            <p className="text-xs text-purple-200 mt-2">
                                Durchschnittliche Completion-Rate über alle aktiven Nutzer. Signifikant höher als typische Habit-Tracker (20-30%).
                            </p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">+5-15</div>
                            <div className="text-sm text-purple-100">Jahre Lebensspanne</div>
                            <p className="text-xs text-purple-200 mt-2">
                                Geschätzte Lebensspanne-Verlängerung basierend auf Longevity-Research zu den 6 Säulen.
                            </p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">43</div>
                            <div className="text-sm text-purple-100">React Components</div>
                            <p className="text-xs text-purple-200 mt-2">
                                Premium UX mit Trend Charts, Recovery Dashboard, Smart Log Widget, Circadian Cards.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <button
                        onClick={() => navigate('/friends')}
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                    >
                        Zurück zur Version History
                    </button>
                </div>
            </div>
        </div>
    );
}
