import React, { useState } from 'react';
import { Sun, Moon, Brain, Dumbbell, Pill, Utensils, Plane, Thermometer, Sparkles, Zap, Calendar, Watch, Package, ChevronRight, Check, AlertCircle } from 'lucide-react';

const horizons = [
  { id: 'mvp', name: 'Current MVP', months: '0', color: 'gray' },
  { id: 'h1', name: 'Horizon 1: Context', months: '0-6', color: 'blue' },
  { id: 'h2', name: 'Horizon 2: Zero-Input', months: '6-12', color: 'purple' },
  { id: 'h3', name: 'Horizon 3: Concierge', months: '12-24', color: 'emerald' },
];

const modes = [
  { id: 'travel', name: 'Travel', icon: Plane, focus: 'Jetlag, Light Timing, Melatonin' },
  { id: 'sick', name: 'Sick', icon: Thermometer, focus: 'Recovery, Sleep, Zinc' },
  { id: 'detox', name: 'Detox', icon: Sparkles, focus: 'Electrolytes, Sauna, Reset' },
  { id: 'deep', name: 'Deep Work', icon: Brain, focus: 'Nootropics, Focus, Flow' },
];

const pillars = [
  { id: 'sleep', name: 'Schlaf', icon: Moon, color: 'bg-indigo-500', need: 73 },
  { id: 'circadian', name: 'Circadian', icon: Sun, color: 'bg-amber-500', need: 78 },
  { id: 'mental', name: 'Mental', icon: Brain, color: 'bg-purple-500', need: 82 },
  { id: 'nutrition', name: 'Ernährung', icon: Utensils, color: 'bg-orange-500', need: 58 },
  { id: 'movement', name: 'Bewegung', icon: Dumbbell, color: 'bg-emerald-500', need: 45 },
  { id: 'supplements', name: 'Supplements', icon: Pill, color: 'bg-cyan-500', need: 30 },
];

// MVP Dashboard
function MVPDashboard() {
  const [tasks, setTasks] = useState([
    { id: 1, done: false, pillar: 'circadian', text: '2-3 Min Tageslicht draußen', time: 3 },
    { id: 2, done: true, pillar: 'sleep', text: 'Blaulichtbrille ab 20:00', time: 2 },
    { id: 3, done: false, pillar: 'mental', text: '5 Min Atemübung', time: 5 },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedCount = tasks.filter(t => t.done).length;

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Heute</h3>
          <p className="text-sm text-slate-500">Dienstag, 4. Februar 2026 • Tag 4 von 30</p>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-700">{completedCount}/{tasks.length}</span>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map(task => {
          const pillar = pillars.find(p => p.id === task.pillar);
          const Icon = pillar?.icon || Sun;
          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                task.done ? 'bg-emerald-50' : 'bg-white'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                task.done ? 'bg-emerald-500' : 'border-2 border-slate-300'
              }`}>
                {task.done && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-1.5 rounded-lg ${pillar?.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className={`flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {task.text}
              </span>
              <span className="text-sm text-slate-400">{task.time} min</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="text-sm text-slate-500 text-right">
        Gesamt: 10 min • {10 - tasks.filter(t => t.done).reduce((a, t) => a + t.time, 0)} min übrig
      </div>
    </div>
  );
}

// H1 Dashboard with Modes
function H1Dashboard() {
  const [activeMode, setActiveMode] = useState('travel');
  const [tasks, setTasks] = useState([
    { id: 1, done: false, pillar: 'circadian', text: '10 min Morgenlicht (Jetlag-Reset)', time: 10 },
    { id: 2, done: false, pillar: 'supplements', text: 'Melatonin um 21:00 (3mg)', time: 1 },
    { id: 3, done: false, pillar: 'circadian', text: 'Kein Koffein nach 14:00', time: 0 },
    { id: 4, done: false, pillar: 'movement', text: 'Kein HIIT heute - nur leichte Bewegung', time: 15 },
  ]);

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      {/* Mode Alert */}
      <div className="bg-blue-500 text-white rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          <span className="font-medium">TRAVEL MODE AKTIV</span>
        </div>
        <span className="text-sm opacity-80">Flug nach London erkannt</span>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-4 gap-2">
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`p-3 rounded-xl text-center transition-all ${
                activeMode === mode.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-white border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-1 ${
                activeMode === mode.id ? 'text-blue-600' : 'text-slate-500'
              }`} />
              <span className={`text-xs font-medium ${
                activeMode === mode.id ? 'text-blue-700' : 'text-slate-600'
              }`}>{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map(task => {
          const pillar = pillars.find(p => p.id === task.pillar);
          const Icon = pillar?.icon || Sun;
          return (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-white">
              <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
              <div className={`p-1.5 rounded-lg ${pillar?.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="flex-1 text-slate-700">{task.text}</span>
              {task.time > 0 && <span className="text-sm text-slate-400">{task.time} min</span>}
            </div>
          );
        })}
      </div>

      {/* Wearable Connection */}
      <div className="bg-slate-100 rounded-lg p-3">
        <p className="text-sm text-slate-600 mb-2">Wearables verbinden</p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            + Oura
          </button>
          <button className="px-3 py-1.5 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            + Whoop
          </button>
          <button className="px-3 py-1.5 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            + Apple Health
          </button>
        </div>
      </div>
    </div>
  );
}

// H2 Dashboard with Readiness
function H2Dashboard() {
  const readiness = 34;

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      {/* Readiness Score */}
      <div className="bg-white rounded-xl p-4 text-center">
        <p className="text-sm text-slate-500 mb-2">MORGEN-READINESS</p>
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-white">{readiness}</span>
        </div>
        <p className="text-slate-700 font-medium">"Erholungstag empfohlen"</p>
        <div className="mt-3 text-sm text-slate-500 space-y-1">
          <p>HRV: 42ms (↓18% vs baseline)</p>
          <p>Schlaf: 5h 23m | REM: 12%</p>
        </div>
      </div>

      {/* Auto-Swap Alert */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
          <AlertCircle className="w-5 h-5" />
          AUTOMATISCHER TAUSCH
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span className="line-through text-slate-400">HIIT Training (45 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span>
            <span className="text-slate-700">Yoga Nidra + Light Walk (30 min)</span>
          </div>
        </div>
        <p className="text-xs text-purple-600 mt-3">Grund: HRV 18% unter deinem Durchschnitt</p>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
            Akzeptieren
          </button>
          <button className="flex-1 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm">
            Original behalten
          </button>
        </div>
      </div>

      {/* Wearable Status */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Watch className="w-4 h-4" />
        <span>Verbunden: Oura Ring • Whoop 4.0</span>
      </div>
    </div>
  );
}

// H3 Dashboard with Fulfillment
function H3Dashboard() {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      {/* Readiness Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-lg font-bold text-white">78</span>
          </div>
          <div>
            <p className="font-medium text-slate-800">Guter Tag</p>
            <p className="text-xs text-slate-500">Volle Intensität möglich</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Mode: Normal</p>
        </div>
      </div>

      {/* Supplement Stack */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5" />
          <span className="font-semibold">DEIN SUPPLEMENT-STACK</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-emerald-200 text-xs mb-1">MORGENS</p>
            <ul className="text-sm space-y-1">
              <li>• Vitamin D3+K2 (5000 IU)</li>
              <li>• Omega-3 (2g EPA/DHA)</li>
              <li>• Creatine (5g)</li>
            </ul>
          </div>
          <div>
            <p className="text-emerald-200 text-xs mb-1">ABENDS</p>
            <ul className="text-sm space-y-1">
              <li>• Magnesium Threonate</li>
              <li>• Apigenin (50mg)</li>
            </ul>
          </div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Nächste Lieferung: 15. Feb</p>
              <p className="text-sm text-emerald-200">€247/Monat • 76 Tage verbleibend</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Travel Detection */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
          <Plane className="w-5 h-5" />
          REISE ERKANNT
        </div>
        <p className="text-sm text-slate-600 mb-3">
          London (20-27. Feb) • 7 Tage
        </p>
        <p className="text-sm text-blue-700 mb-3">
          "Sollen wir dein Travel-Pack zum Hotel schicken?"
        </p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            ✓ Ja, zum Hotel
          </button>
          <button className="flex-1 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm">
            Nein, ich pack selbst
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductEvolutionMockup() {
  const [activeHorizon, setActiveHorizon] = useState('mvp');

  const renderDashboard = () => {
    switch (activeHorizon) {
      case 'mvp': return <MVPDashboard />;
      case 'h1': return <H1Dashboard />;
      case 'h2': return <H2Dashboard />;
      case 'h3': return <H3Dashboard />;
      default: return <MVPDashboard />;
    }
  };

  const getHorizonDescription = () => {
    switch (activeHorizon) {
      case 'mvp': return { title: 'Current MVP', desc: 'Static 30-day plans with manual task tracking' };
      case 'h1': return { title: 'Context Awareness', desc: 'Emergency Modes + Calendar-based auto-detection' };
      case 'h2': return { title: 'Zero-Input Layer', desc: 'Wearable-driven readiness + automatic protocol swaps' };
      case 'h3': return { title: 'Concierge Loop', desc: 'Lab integration + personalized supplement fulfillment' };
      default: return { title: '', desc: '' };
    }
  };

  const info = getHorizonDescription();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">ExtensioVitae Evolution</h1>
          <p className="text-slate-400">Vom Content-Provider zum Biologischen Family Office</p>
        </div>

        {/* Horizon Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {horizons.map(h => (
            <button
              key={h.id}
              onClick={() => setActiveHorizon(h.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeHorizon === h.id
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-1">{info.title}</h2>
          <p className="text-slate-400 text-sm">{info.desc}</p>
        </div>

        {/* Phone Mockup */}
        <div className="bg-slate-800 rounded-3xl p-3">
          <div className="bg-slate-100 rounded-2xl overflow-hidden">
            {/* Status Bar */}
            <div className="bg-slate-200 px-4 py-2 flex justify-between items-center text-xs text-slate-600">
              <span>9:41</span>
              <span>ExtensioVitae</span>
              <span>100%</span>
            </div>

            {/* Content */}
            <div className="p-4">
              {renderDashboard()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>North Star Progress</span>
            <span>{activeHorizon === 'mvp' ? '15%' : activeHorizon === 'h1' ? '40%' : activeHorizon === 'h2' ? '70%' : '100%'}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500"
              style={{
                width: activeHorizon === 'mvp' ? '15%' : activeHorizon === 'h1' ? '40%' : activeHorizon === 'h2' ? '70%' : '100%'
              }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {activeHorizon === 'mvp' ? '5-10' : activeHorizon === 'h1' ? '3-5' : activeHorizon === 'h2' ? '<3' : '<1'}
            </p>
            <p className="text-xs text-slate-400">min/Tag</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {activeHorizon === 'mvp' ? '0%' : activeHorizon === 'h1' ? '30%' : activeHorizon === 'h2' ? '90%' : '95%'}
            </p>
            <p className="text-xs text-slate-400">Auto-Input</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {activeHorizon === 'mvp' ? '€0' : activeHorizon === 'h1' ? '€10' : activeHorizon === 'h2' ? '€30' : '€247'}
            </p>
            <p className="text-xs text-slate-400">ARPU/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
