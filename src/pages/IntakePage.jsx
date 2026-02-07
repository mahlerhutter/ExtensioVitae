import React, { useState, useEffect } from 'react';
import { saveIntake, getIntake } from '../lib/dataService';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../lib/supabase';
import { trackIntakeCompleted } from '../lib/analytics';
import { useToast } from '../components/Toast';
import { logger } from '../lib/logger';
import ProgressBar from '../components/onboarding/ProgressBar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ============================================
// FIELD CONFIGURATION
// ============================================

const ALL_QUESTIONS = [
  // --- BASICS ---
  {
    id: 'name',
    step: 0,
    question: "Wie heißt du?",
    type: 'text',
    placeholder: 'Vorname',
    required: true,
    autocomplete: 'name',
  },
  {
    id: 'age',
    step: 0,
    question: "Wie alt bist du?",
    type: 'number',
    min: 18,
    max: 80,
    placeholder: 'Alter (18-80)',
    required: true,
    helper: 'Wir erstellen Pläne für Erwachsene von 18-80 Jahren.',
    autocomplete: 'off',
  },
  {
    id: 'sex',
    step: 0,
    question: "Biologisches Geschlecht",
    type: 'select',
    required: true,
    options: [
      { value: 'male', label: 'Männlich' },
      { value: 'female', label: 'Weiblich' },
      { value: 'diverse', label: 'Divers' },
    ],
  },

  // --- STATUS ---
  {
    id: 'sleep_hours_bucket',
    step: 1,
    question: "Durchschnittlicher Nachtschlaf?",
    type: 'select',
    required: true,
    options: [
      { value: '<6', label: 'Weniger als 6 Stunden' },
      { value: '6-6.5', label: '6 - 6,5 Stunden' },
      { value: '6.5-7', label: '6,5 - 7 Stunden' },
      { value: '7-7.5', label: '7 - 7,5 Stunden' },
      { value: '7.5-8', label: '7,5 - 8 Stunden' },
      { value: '>8', label: 'Mehr als 8 Stunden' },
    ],
  },
  {
    id: 'stress_1_10',
    step: 1,
    question: "Aktuelles Stresslevel (1-10)",
    type: 'range',
    min: 1,
    max: 10,
    required: true,
    helper: '1 = Total entspannt, 10 = Kurz vor dem Burnout'
  },
  {
    id: 'training_frequency',
    step: 1,
    question: "Trainingseinheiten pro Woche",
    type: 'select',
    required: true,
    options: [
      { value: '0', label: '0 Mal' },
      { value: '1-2', label: '1-2 Mal' },
      { value: '3-4', label: '3-4 Mal' },
      { value: '5+', label: '5+ Mal' },
    ],
  },
  {
    id: 'diet_pattern',
    step: 1,
    question: "Ernährungsgewohnheiten (Bis zu 5 wählen)",
    type: 'multiselect',
    required: true,
    max_select: 5,
    options: [
      { value: 'mostly_whole_foods', label: 'Überwiegend Vollwertkost' },
      { value: 'high_ultra_processed', label: 'Viel Fertigprodukte' },
      { value: 'high_sugar_snacks', label: 'Viel Zucker/Snacks' },
      { value: 'frequent_alcohol', label: 'Häufig Alkohol' },
      { value: 'high_protein_focus', label: 'Proteinreich' },
      { value: 'late_eating', label: 'Spätes Essen' },
    ],
  },
  {
    id: 'height_cm',
    step: 1,
    question: "Größe (cm)",
    type: 'number',
    min: 130,
    max: 220,
    required: false, // Optional
    placeholder: '175'
  },
  {
    id: 'weight_kg',
    step: 1,
    question: "Gewicht (kg)",
    type: 'number',
    min: 40,
    max: 200,
    required: false, // Optional
    placeholder: '70'
  },

  // --- GOALS ---
  {
    id: 'primary_goal',
    step: 2,
    question: "Was ist dein #1 Longevity-Ziel?",
    type: 'select',
    required: true,
    options: [
      { value: 'energy', label: 'Mehr Energie' },
      { value: 'sleep', label: 'Besserer Schlaf' },
      { value: 'stress', label: 'Weniger Stress' },
      { value: 'fat_loss', label: 'Fettabbau' },
      { value: 'strength_fitness', label: 'Kraft & Fitness' },
      { value: 'focus_clarity', label: 'Fokus & Klarheit' },
    ],
  },
  {
    id: 'daily_time_budget',
    step: 2,
    question: "Tägliches Zeitbudget (Minuten)",
    type: 'select',
    required: false, // Optional
    options: [
      { value: '10', label: '10 Minuten' },
      { value: '20', label: '20 Minuten' },
      { value: '30', label: '30 Minuten' },
    ],
  },
  {
    id: 'equipment_access',
    step: 2,
    question: "Geräte-Zugang",
    type: 'select',
    required: false, // Optional
    options: [
      { value: 'none', label: 'Keine Geräte' },
      { value: 'basic', label: 'Home-Gym (Basics)' },
      { value: 'gym', label: 'Fitnessstudio' },
    ],
  },
];

const STEPS = [
  { label: 'Basics', title: 'Wer bist du?' },
  { label: 'Status', title: 'Dein Ausgangspunkt' },
  { label: 'Goals', title: 'Deine Ziele' },
];

// ============================================
// COMPONENT DEFINITIONS (Reusable)
// ============================================

function NumberField({ question, value, onChange, placeholder, helper, min, max, autocomplete }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <input
        type="text" // using text with inputMode numeric to avoid spinner arrows
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || /^\d+$/.test(val)) onChange(val);
        }}
        min={min}
        max={max}
        placeholder={placeholder}
        autoComplete={autocomplete || 'off'}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none transition-all"
      />
      {helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function RangeField({ question, value, onChange, min, max, helper }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center">
        <label className="block text-xl font-medium text-white">
          {question}
        </label>
        <span className="text-amber-400 font-bold text-2xl">{value || '-'}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value || Math.ceil((max - min) / 2) + min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
      />
      <div className="flex justify-between text-xs text-slate-500 font-medium">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function TextField({ question, value, onChange, placeholder, helper, autocomplete }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autocomplete || 'off'}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
      />
      {helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function SelectField({ question, value, onChange, options }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-lg border text-left text-sm transition-all duration-200 ${value === option.value
              ? 'bg-amber-400/10 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-750'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectField({ question, value = [], onChange, options, max_select }) {
  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (max_select && value.length >= max_select) return;
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-3 animate-fadeIn">
      <label className="block text-xl font-medium text-white">
        {question} <span className="text-sm font-normal text-slate-400">(Max {max_select})</span>
      </label>
      <p className="text-slate-500 text-sm">Select all that apply</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={!value.includes(option.value) && max_select && value.length >= max_select}
            className={`p-3 rounded-lg border text-left text-sm transition-all duration-200 ${value.includes(option.value)
              ? 'bg-amber-400/10 border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]'
              : (!value.includes(option.value) && max_select && value.length >= max_select)
                ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConsentCheckbox({ checked, onChange }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-6 h-6 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400 focus:ring-offset-slate-900"
        />
        <span className="text-slate-300 text-sm leading-relaxed">
          I agree to receive specific notifications about my longevity plan. I can unsubscribe anytime.
        </span>
      </label>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function IntakePage() {
  useDocumentTitle('Design Your Plan - ExtensioVitae');
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    stress_1_10: 5,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Load user data logic
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      setIsLoadingUserData(true);
      try {
        const profile = await getUserProfile(user.id);
        const previousIntake = await getIntake();
        const preFillData = {};

        // Strategy: Use previous intake if available, else profile
        if (profile?.name) preFillData.name = profile.name;
        if (previousIntake) {
          if (previousIntake.name) preFillData.name = previousIntake.name;
          if (previousIntake.age) preFillData.age = previousIntake.age;
          if (previousIntake.sex) preFillData.sex = previousIntake.sex;
          // ... map other fields if needed, but these are the basics
        }

        if (Object.keys(preFillData).length > 0) {
          setFormData(prev => ({ ...prev, ...preFillData }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    }
    loadUserData();
  }, [user]);

  const updateField = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const getQuestionComponent = (q) => {
    switch (q.type) {
      case 'text': return <TextField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'number': return <NumberField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'range': return <RangeField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'select': return <SelectField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'multiselect': return <MultiSelectField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      default: return null;
    }
  };

  const validateStep = (stepIndex) => {
    const errors = [];
    const questionsInStep = ALL_QUESTIONS.filter(q => q.step === stepIndex);

    for (const q of questionsInStep) {
      if (q.required) {
        const val = formData[q.id];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          errors.push(`Bitte ausfüllen: ${q.question}`);
          continue;
        }

        // Specific type validations
        if (q.type === 'number') {
          const num = Number(val);
          if (isNaN(num)) errors.push(`${q.question} muss eine Zahl sein`);
          else if (q.min !== undefined && num < q.min) errors.push(`${q.question} muss mindestens ${q.min} sein`);
          else if (q.max !== undefined && num > q.max) errors.push(`${q.question} darf maximal ${q.max} sein`);
        }

        if (q.type === 'multiselect' && (!Array.isArray(val) || val.length === 0)) {
          errors.push(`Wähle mindestens eine Option für ${q.question}`);
        }
      }
    }

    // Step 2 (Final Step, index 2) - Check Consent
    if (stepIndex === 2) {
      if (!formData.whatsapp_consent) {
        errors.push('Bitte akzeptiere die Einwilligung, um fortzufahren.');
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      addToast(errors[0], 'error');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      ...formData,
      whatsapp_consent: formData.whatsapp_consent || false,
      submitted_at: new Date().toISOString(),
    };

    try {
      await saveIntake(payload);
      trackIntakeCompleted(payload);
      window.location.href = '/generating';
    } catch (error) {
      console.error('[Intake] Error saving intake:', error);
      window.location.href = '/generating';
    }
  };

  // Render Logic
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 sticky top-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-white tracking-tight">
            Extensio<span className="text-amber-400">Vitae</span>
          </a>
          <div className="text-xs text-slate-500 font-mono">
            SCHRITT {currentStep + 1}/{STEPS.length}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="max-w-xl mx-auto w-full px-6 py-8 flex-1 flex flex-col">

          {/* Progress Bar */}
          <div className="mb-8">
            <ProgressBar
              currentStep={currentStep + 1}
              totalSteps={STEPS.length}
              stepLabels={STEPS.map(s => s.label)}
            />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              {STEPS[currentStep].title}
            </h1>
          </div>

          {isLoadingUserData ? (
            <div className="flex-1 flex flex-col justify-center items-center opacity-50">
              <div className="animate-spin h-8 w-8 border-2 border-amber-400 rounded-full border-t-transparent mb-4"></div>
              <p className="text-slate-400">Profil wird geladen...</p>
            </div>
          ) : (
            <>
              {/* Question Form */}
              <div className="space-y-10 flex-1">
                {ALL_QUESTIONS
                  .filter(q => q.step === currentStep)
                  .map(q => getQuestionComponent(q))}

                {/* Consent Checkbox only on last step */}
                {isLastStep && (
                  <div className="space-y-4 animate-fadeIn">
                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.whatsapp_consent || false}
                        onChange={(e) => updateField('whatsapp_consent', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-slate-700"
                      />
                      <div className="text-sm text-slate-300">
                        Ich stimme zu, mein Longevity-Protokoll per WhatsApp zu erhalten und akzeptiere die <a href="/terms" target="_blank" className="text-amber-400 hover:underline">Nutzungsbedingungen</a> & <a href="/privacy" target="_blank" className="text-amber-400 hover:underline">Datenschutzerklärung</a>.
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl text-lg font-bold transition-all transform shadow-lg ${isSubmitting
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-900 hover:scale-[1.02] shadow-amber-400/20'
                    }`}
                >
                  {isSubmitting ? 'Plan wird erstellt...' : (isLastStep ? 'Blueprint erstellen →' : 'Weiter')}
                </button>

                {canGoBack && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Zurück
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
