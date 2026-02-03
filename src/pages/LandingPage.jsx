import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateQuickScore } from '../lib/longevityScore';

// Icons as simple SVG components
const icons = {
  sleep: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  movement: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  nutrition: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  stress: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  connection: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  environment: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

const pillars = [
  {
    key: 'sleep',
    label: 'Sleep',
    description: 'Optimize your recovery architecture',
    arguments: ['Hormone and immune reset', 'Memory consolidation and clarity', 'Deep repair for longevity'],
  },
  {
    key: 'movement',
    label: 'Movement',
    description: 'Strategic physical stress for adaptation',
    arguments: ['Maintain muscle and bone', 'Boost metabolic resilience', 'Protect cognition and mood'],
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    description: 'Fuel timing and quality, simplified',
    arguments: ['Stabilize energy and cravings', 'Lower inflammation load', 'Support gut-brain function'],
  },
  {
    key: 'stress',
    label: 'Calm',
    description: 'Regulate your nervous system daily',
    arguments: ['Improve recovery and sleep', 'Protect cardiovascular health', 'Increase focus under pressure'],
  },
  {
    key: 'connection',
    label: 'Connection',
    description: 'Purpose and social bonds that matter',
    arguments: ['Stronger resilience and motivation', 'Better immune outcomes', 'Longer, healthier lifespan'],
  },
  {
    key: 'environment',
    label: 'Environment',
    description: 'Reduce toxins, optimize your space',
    arguments: ['Lower chronic exposure risk', 'Support circadian rhythm', 'Make healthy choices easier'],
  },
];

const steps = [
  { number: '01', title: 'Answer', description: '7 focused questions about your life, goals, and constraints.' },
  { number: '02', title: 'Receive', description: 'Your personalized 30-day plan—organized by pillar, day by day.' },
  { number: '03', title: 'Execute', description: 'Daily WhatsApp nudges keep you on track. ≤30 min/day.' },
];

// Navbar Component
function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold text-white tracking-tight">
          Extensio<span className="text-amber-400">Vitae</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#how-it-works" className="text-slate-300 hover:text-white text-sm transition-colors">
            How It Works
          </a>
          {isAuthenticated ? (
            <a href="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors flex items-center gap-2">
              <span>{displayName}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          ) : (
            <a href="/auth" className="text-slate-300 hover:text-white text-sm transition-colors">
              Log In
            </a>
          )}
          <a
            href={isAuthenticated ? "/dashboard" : "/intake"}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start'}
          </a>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 pt-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight mb-6">
          Your Personalized 30-Day
          <br />
          <span className="text-amber-400">Longevity Blueprint</span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Science-informed. Delivered daily. Under 30 minutes.
        </p>
        <a
          href="/intake"
          className="inline-flex items-center bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 rounded-lg text-lg font-medium transition-all hover:scale-105"
        >
          Get My Blueprint
          {icons.arrow}
        </a>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 text-slate-400">
          <div className="flex items-center gap-2">
            {icons.check}
            <span>3-minute intake</span>
          </div>
          <div className="flex items-center gap-2">
            {icons.check}
            <span>Personalized to your life</span>
          </div>
          <div className="flex items-center gap-2">
            {icons.check}
            <span>Daily WhatsApp nudges</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pillars Section
function Pillars() {
  return (
    <section className="py-24 bg-slate-800">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-4">
          Built on 6 Pillars of Longevity
        </h2>
        <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
          Each day's plan addresses what matters most for extending your healthspan.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.key}
              className="relative bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center hover:border-amber-400/50 transition-colors group overflow-hidden"
              tabIndex={0}
            >
              <div className="text-slate-400 group-hover:text-amber-400 transition-colors mb-4 flex justify-center">
                {icons[pillar.key]}
              </div>
              <h3 className="text-white font-medium mb-2">{pillar.label}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{pillar.description}</p>
              <div className="absolute inset-0 rounded-xl bg-slate-950/95 border border-amber-400/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-4 flex flex-col justify-center">
                <p className="text-amber-300 text-[10px] uppercase tracking-[0.2em] mb-2">Why it matters</p>
                <ul className="text-slate-200 text-xs leading-snug space-y-1.5">
                  {pillar.arguments.map((argument) => (
                    <li key={argument} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{argument}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-4">
          Three Minutes to Your Blueprint
        </h2>
        <p className="text-slate-400 text-center mb-8">
          No fluff. No overwhelm. Just clarity.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-6 mb-16 border border-slate-700/50 max-w-3xl mx-auto">
          <p className="text-slate-300 text-center leading-relaxed italic">
            "In nur 3 Minuten beantworten wir dir ein paar kluge Fragen – nicht, um Daten zu sammeln, sondern um sofort die richtigen Hebel zu finden. Dein Hauptziel, dein aktueller Stress und dein Schlaf bestimmen Ton und Intensität deines Plans. Dein Trainingslevel und dein verfügbares Equipment sorgen dafür, dass alles realistisch umsetzbar ist – ohne Selbstbetrug. Dein Ernährungsmuster zeigt uns die größten, schnellsten Stellschrauben, ohne dass du dich durch Ernährungsdogmen kämpfen musst. Und dein tägliches Zeitbudget schützt dich vor dem Killer aller Programme: Overengineering. Ergebnis: ein 30-Tage-Blueprint, der nicht hübsch klingt, sondern funktioniert."
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="text-amber-400/20 text-7xl font-bold absolute -top-4 -left-2">
                {step.number}
              </div>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 text-slate-700">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Philosophy Section
function Philosophy() {
  return (
    <section className="py-24 bg-slate-800">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8">
          Our Philosophy
        </h2>
        <p className="text-xl text-slate-300 leading-relaxed mb-12">
          We believe longevity is built in daily micro-decisions, not radical interventions.
          ExtensioVitae gives you the clarity to act—without the overwhelm.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-400">
          <div className="flex items-center gap-2">
            {icons.check}
            <span>No medical claims</span>
          </div>
          <div className="flex items-center gap-2">
            {icons.check}
            <span>Evidence-informed</span>
          </div>
          <div className="flex items-center gap-2">
            {icons.check}
            <span>Privacy-first</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Life in Weeks Calculator Section
function LifeInWeeksSection() {
  const [inputs, setInputs] = useState({
    age: 35,
    sleepHours: 7,
    stressLevel: 5,
    exerciseFrequency: 2
  });
  const [showResults, setShowResults] = useState(false);

  const scoreData = useMemo(() => {
    if (!showResults) return null;
    return calculateQuickScore(inputs);
  }, [inputs, showResults]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    if (showResults) setShowResults(false);
  };

  // Life in Weeks Grid Component (inline)
  const LifeWeeksGrid = ({ weeksLived, currentRemaining, optimizedRemaining }) => {
    const WEEKS_PER_YEAR = 52;
    const MAX_YEARS = 90;
    const TOTAL_WEEKS = MAX_YEARS * WEEKS_PER_YEAR;

    const getWeekStatus = (index) => {
      if (index < weeksLived) return 'lived';
      if (index < weeksLived + currentRemaining) return 'current';
      if (index < weeksLived + optimizedRemaining) return 'potential';
      return 'beyond';
    };

    const statusColors = {
      lived: 'bg-slate-600',
      current: 'bg-slate-500',
      potential: 'bg-amber-500',
      beyond: 'bg-slate-800'
    };

    // Show every 5th year for compact display
    const yearsToShow = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

    return (
      <div className="relative">
        {/* Compact grid - show representative rows */}
        <div className="space-y-1">
          {yearsToShow.slice(0, -1).map((year, idx) => {
            const startWeek = year * WEEKS_PER_YEAR;
            const endWeek = yearsToShow[idx + 1] * WEEKS_PER_YEAR;
            const midWeek = Math.floor((startWeek + endWeek) / 2);

            // Sample 26 weeks from this decade (every other week)
            const sampledWeeks = [];
            for (let w = startWeek; w < endWeek; w += 2) {
              sampledWeeks.push(w);
            }

            return (
              <div key={year} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-6 text-right">{year}</span>
                <div className="flex gap-px flex-wrap flex-1">
                  {sampledWeeks.slice(0, 26).map((weekIdx) => (
                    <div
                      key={weekIdx}
                      className={`w-2 h-2 rounded-sm ${statusColors[getWeekStatus(weekIdx)]} transition-all`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Wie viele Wochen hast du noch?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Die durchschnittliche Person verschenkt 8-12 Jahre an vermeidbare Faktoren.
            Finde heraus, wie viel Potenzial in deinem Lifestyle steckt.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
          {/* Input Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Age */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Alter</label>
              <input
                type="number"
                value={inputs.age}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 35)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg focus:border-amber-400 focus:outline-none"
                min="18"
                max="80"
              />
            </div>

            {/* Sleep */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Schlaf (h/Nacht)</label>
              <input
                type="number"
                value={inputs.sleepHours}
                onChange={(e) => handleInputChange('sleepHours', parseFloat(e.target.value) || 7)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg focus:border-amber-400 focus:outline-none"
                min="4"
                max="10"
                step="0.5"
              />
            </div>

            {/* Stress */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Stress (1-10)</label>
              <input
                type="number"
                value={inputs.stressLevel}
                onChange={(e) => handleInputChange('stressLevel', parseInt(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg focus:border-amber-400 focus:outline-none"
                min="1"
                max="10"
              />
            </div>

            {/* Exercise */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Training/Woche</label>
              <input
                type="number"
                value={inputs.exerciseFrequency}
                onChange={(e) => handleInputChange('exerciseFrequency', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg focus:border-amber-400 focus:outline-none"
                min="0"
                max="7"
              />
            </div>
          </div>

          {/* Calculate Button */}
          {!showResults && (
            <div className="text-center">
              <button
                onClick={handleCalculate}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              >
                Berechnen
              </button>
            </div>
          )}

          {/* Results */}
          {showResults && scoreData && (
            <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-700 animate-fadeIn">
              {/* Score Card */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-4">
                  {/* Circular Score */}
                  <div className="relative">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none" stroke="#334155" strokeWidth="8"
                      />
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={scoreData.scoreLabel.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(scoreData.score / 100) * 283} 283`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{scoreData.score}</span>
                      <span className="text-xs text-slate-400">von 100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{scoreData.scoreLabel.emoji}</span>
                  <span className="text-xl font-semibold" style={{ color: scoreData.scoreLabel.color }}>
                    {scoreData.scoreLabel.text}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-slate-400">
                    Biologisches Alter: <span className={scoreData.biologicalAgeDiff <= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {scoreData.biologicalAge}
                    </span>
                    <span className="text-slate-500"> (Chrono: {scoreData.chronologicalAge})</span>
                  </p>

                  {scoreData.potentialGainYears > 0 && (
                    <p className="text-amber-400 font-semibold text-lg">
                      +{scoreData.potentialGainYears} Jahre möglich
                    </p>
                  )}
                </div>
              </div>

              {/* Life in Weeks */}
              <div>
                <h4 className="text-white font-semibold mb-3 text-center">Dein Leben in Wochen</h4>
                <LifeWeeksGrid
                  weeksLived={scoreData.weeksLived}
                  currentRemaining={scoreData.currentRemainingWeeks}
                  optimizedRemaining={scoreData.optimizedRemainingWeeks}
                />

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-slate-600" />
                    <span className="text-slate-400">Gelebt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-slate-500" />
                    <span className="text-slate-400">Prognose</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-slate-400">+ Potenzial</span>
                  </div>
                </div>

                {/* Weeks Count */}
                <p className="text-center text-slate-500 text-sm mt-4">
                  Du hast noch <span className="text-white font-semibold">{scoreData.currentRemainingWeeks.toLocaleString()}</span> Wochen.
                  {scoreData.potentialGainWeeks > 0 && (
                    <span className="text-amber-400"> (+{scoreData.potentialGainWeeks.toLocaleString()} möglich)</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA after results */}
        {showResults && (
          <div className="text-center animate-fadeIn">
            <p className="text-xl text-slate-300 mb-6">
              "{inputs.age < 50 ? 'Du hast die Chance' : 'Es ist nie zu spät'}, diese Wochen zu den besten deines Lebens zu machen."
            </p>
            <a
              href="/intake"
              className="inline-flex items-center bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 rounded-lg text-lg font-medium transition-all hover:scale-105"
            >
              Jetzt Blueprint erstellen
              {icons.arrow}
            </a>
            <p className="text-slate-500 text-sm mt-4">
              Dieser Score dient der Motivation und ist keine medizinische Diagnose.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8">
          Ready to extend your vitae?
        </h2>
        <a
          href="/intake"
          className="inline-flex items-center bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 rounded-lg text-lg font-medium transition-all hover:scale-105 mb-6"
        >
          Start Now
          {icons.arrow}
        </a>
        <p className="text-slate-500">
          Free for early adopters. No credit card required.
        </p>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="text-slate-500 text-sm">
            © 2025 ExtensioVitae. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <a href="/science" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Wissenschaft
            </a>
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Datenschutz</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">AGB</a>
            <a href="mailto:hello@extensiovitae.com" className="hover:text-slate-300 transition-colors">Kontakt</a>
          </div>
        </div>
        {/* Science teaser */}
        <div className="pt-6 border-t border-slate-800/50">
          <a href="/science" className="block bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-amber-400/30 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <p className="text-white font-medium text-sm">Wissenschaftliche Evidenz</p>
                  <p className="text-slate-500 text-xs">Erfahre, warum 3 Minuten Input zu personalisierten Ergebnissen führen →</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Only redirect if authenticated AND 'noredirect' param is NOT present
    if (!loading && isAuthenticated && !searchParams.get('noredirect')) {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">
      <Navbar />
      <Hero />
      <Pillars />
      <HowItWorks />
      <LifeInWeeksSection />
      <Philosophy />
      <FinalCTA />
      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
