import React, { useState } from 'react';
import { Activity, Heart, Moon, TrendingUp, Flame, Clock, Info, X, ChevronRight } from 'lucide-react';

/**
 * EXTENSIOVITAE - DASHBOARD MOCKUP
 *
 * UX-Philosophie: "Zero Mental Overhead"
 * Basiert auf: DASHBOARD_UX_CONCEPT.md
 *
 * Design-Prinzipien:
 * 1. Anticipatory Design - System sagt "Das ist zu tun", nicht "Was willst du?"
 * 2. Progressive Disclosure - Wissenschaft auf Toggle, nicht permanent
 * 3. Identity Reinforcement - "Optimieren", nicht "erledigen"
 */

export default function DashboardMockupPage() {
  const [showScienceModal, setShowScienceModal] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Mock Data (simuliert Live-Daten)
  const mockData = {
    recoveryScore: 72,
    recoveryState: 'optimal', // optimal, moderate, low
    hrv: 48,
    hrvBaseline: 45,
    sleep: 7.2,
    rhr: 58,
    streak: 12,
    yearsAdded: 2.7,
    progressToday: 63,

    nextTask: {
      id: 1,
      title: 'Morning Sunlight',
      description: '10 Minuten Sonnenlicht (optimal für Cortisol-Reset)',
      duration: 10,
      category: 'recovery',
      timeWindow: 'noch 28min optimal',
      optimalTimes: '07:00–10:00'
    },

    upcomingTasks: [
      { id: 2, title: 'Strength Training', duration: 35 },
      { id: 3, title: 'Protein (30g)', duration: 5 },
      { id: 4, title: 'Review Lab Results', duration: 15 }
    ]
  };

  const getRecoveryConfig = (state) => {
    switch (state) {
      case 'optimal':
        return {
          color: '#00FF94',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          label: 'Optimal',
          message: 'Dein Körper ist bereit. Heute kannst du pushen.',
          icon: TrendingUp
        };
      case 'moderate':
        return {
          color: '#FFB800',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          label: 'Moderate',
          message: 'Steady State. Höre auf deinen Körper.',
          icon: Activity
        };
      case 'low':
        return {
          color: '#FF0060',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          label: 'Low Recovery',
          message: 'Dein Körper braucht heute Recovery.',
          icon: Info
        };
      default:
        return {};
    }
  };

  const config = getRecoveryConfig(mockData.recoveryState);
  const RecoveryIcon = config.icon;

  const handleCompleteTask = () => {
    setCompletedTasks([...completedTasks, mockData.nextTask.id]);
    // Simulate task completion with confetti
    if (window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00D9FF', '#FFB800', '#00FF94']
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 font-mono">Freitag, 7. Februar · 07:32</div>
            <h1 className="text-xl font-bold mt-1">Dashboard</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
            <span className="text-lg">👤</span>
          </button>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Recovery State Card */}
          <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6`}>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                {/* Circular Progress */}
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#2A2F3A"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={config.color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - mockData.recoveryScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-2xl font-bold" style={{ color: config.color }}>
                    {mockData.recoveryScore}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RecoveryIcon className="w-5 h-5" style={{ color: config.color }} />
                  <span className="font-mono text-sm font-semibold" style={{ color: config.color }}>
                    RECOVERY: {config.label}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {config.message}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500 text-xs font-mono">HRV</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-mono text-lg font-semibold">{mockData.hrv}</span>
                  <span className="text-gray-600 text-xs font-mono">ms</span>
                </div>
                <div className="text-emerald-400 text-xs font-mono mt-1">
                  ↑{Math.round(((mockData.hrv / mockData.hrvBaseline) - 1) * 100)}%
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500 text-xs font-mono">Sleep</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-mono text-lg font-semibold">{mockData.sleep}</span>
                  <span className="text-gray-600 text-xs font-mono">hrs</span>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500 text-xs font-mono">RHR</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-mono text-lg font-semibold">{mockData.rhr}</span>
                  <span className="text-gray-600 text-xs font-mono">bpm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Card - HERO */}
          <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-xl p-8 shadow-[0_0_30px_rgba(0,217,255,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
                JETZT:
              </span>
              <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <span className="text-emerald-400 font-mono text-xs font-semibold">
                  Recovery: {mockData.recoveryScore}%
                </span>
              </div>
            </div>

            <h2 className="text-white text-3xl font-bold mb-2">
              {mockData.nextTask.title}
            </h2>

            <p className="text-gray-400 mb-6">
              {mockData.nextTask.description}
            </p>

            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400 font-mono">
                <Clock className="w-4 h-4" />
                {mockData.nextTask.duration} min
              </div>

              <div className="flex items-center gap-2 text-amber-400 font-mono">
                <Flame className="w-4 h-4" />
                {mockData.streak}-Tage Streak
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-mono">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                {mockData.nextTask.timeWindow}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCompleteTask}
                disabled={completedTasks.includes(mockData.nextTask.id)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {completedTasks.includes(mockData.nextTask.id) ? (
                  <>
                    <span>✓</span>
                    <span>Erledigt (+0.02 Jahre)</span>
                  </>
                ) : (
                  <span>Jetzt optimieren</span>
                )}
              </button>

              <button className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono rounded-lg transition-colors">
                Später
              </button>
            </div>

            {/* Science Toggle */}
            <button
              onClick={() => setShowScienceModal(true)}
              className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-mono flex items-center gap-1 transition-colors"
            >
              <Info className="w-4 h-4" />
              Warum genau jetzt?
            </button>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-[#1A1F2A] border border-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 font-mono text-xs font-semibold uppercase tracking-wider mb-4">
              DANACH:
            </h3>
            <div className="space-y-3">
              {mockData.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-300">{task.title}</span>
                  </div>
                  <span className="text-gray-600 font-mono text-xs">{task.duration}min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-[#1A1F2A] border border-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 font-mono text-xs font-semibold uppercase tracking-wider mb-4">
              FORTSCHRITT:
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-mono">Heute</span>
                <span className="text-white text-sm font-mono font-semibold">{mockData.progressToday}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${mockData.progressToday}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1 font-mono">
                  +{mockData.yearsAdded} Jahre
                </div>
                <div className="text-gray-500 text-sm">
                  Gesunde Lebensspanne hinzugefügt
                </div>
                <div className="text-gray-600 text-xs mt-2">
                  Basierend auf 90-Tage-Adhärenz
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Science Modal (Progressive Disclosure) */}
      {showScienceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#1A1F2A] border-2 border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1A1F2A] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-cyan-400 font-mono text-sm font-semibold uppercase tracking-wider">
                Wissenschaft Dahinter
              </h3>
              <button
                onClick={() => setShowScienceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Morning Sunlight (07:00-10:00)</h4>
              </div>

              <div>
                <h5 className="text-cyan-400 font-mono text-xs font-semibold uppercase mb-2">Warum Jetzt?</h5>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Cortisol-Peak: 07:00-09:00 (zirkadianer Rhythmus)</li>
                  <li>• Sonnenlicht → 50% Cortisol-Regulation (Huberman, 2023)</li>
                  <li>• Dein Streak: {mockData.streak} Tage → Identitäts-Verstärkung</li>
                </ul>
              </div>

              <div>
                <h5 className="text-cyan-400 font-mono text-xs font-semibold uppercase mb-2">
                  Anpassung an Deinen Körper:
                </h5>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Recovery: {mockData.recoveryScore}% (Optimal) → Keine Intensitäts-Reduktion</li>
                  <li>• HRV heute: {mockData.hrv}ms (↑{Math.round(((mockData.hrv / mockData.hrvBaseline) - 1) * 100)}% vs. 7-Tage-Durchschnitt)</li>
                  <li>• Schlaf: {mockData.sleep}h (Effizienz: 94%)</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h5 className="text-amber-400 font-mono text-xs font-semibold uppercase mb-2">Formel:</h5>
                <pre className="text-gray-400 text-xs font-mono overflow-x-auto">
{`Priority Score =
  (Streak × 100) +
  (OptimalTime × 50) +
  Category

= (${mockData.streak} × 100) + (1 × 50) + 40
= ${mockData.streak * 100 + 50 + 40}`}
                </pre>
              </div>

              <div>
                <h5 className="text-cyan-400 font-mono text-xs font-semibold uppercase mb-2">Studien:</h5>
                <div className="space-y-2 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 block transition-colors">
                    [1] Circadian Rhythms in Exercise (Sports Med, 2024)
                  </a>
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 block transition-colors">
                    [2] Light Exposure and HPA Axis (Huberman Lab, 2023)
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowScienceModal(false)}
                className="w-full px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono rounded-lg transition-colors"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Info Badge */}
      <div className="fixed bottom-6 right-6 bg-[#1A1F2A] border border-cyan-500/30 rounded-lg px-4 py-3 max-w-xs shadow-lg">
        <div className="text-cyan-400 font-mono text-xs font-semibold mb-1">
          UX CONCEPT MOCKUP
        </div>
        <div className="text-gray-400 text-xs">
          Zero Mental Overhead Design
          <br />
          Basiert auf: DASHBOARD_UX_CONCEPT.md
        </div>
      </div>
    </div>
  );
}
