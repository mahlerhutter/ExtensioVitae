import React, { useState, useEffect } from 'react';
import { saveIntake, getIntake } from '../lib/dataService';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../lib/supabase';
import { trackIntakeCompleted } from '../lib/analytics';
import { useToast } from '../components/Toast';
import { logger } from '../lib/logger';
import ProgressBar from '../components/onboarding/ProgressBar';

const QUESTIONS = {
  mandatory: [
    {
      id: 'name',
      question: "What should we call you?",
      type: 'text',
      placeholder: 'First name',
      required: true,
    },
    {
      id: 'age',
      question: "How old are you?",
      type: 'number',
      min: 18,
      max: 80,
      placeholder: 'Age (18-80)',
      required: true,
      helper: 'We create plans for adults 18-80 years old.'
    },
    {
      id: 'sex',
      question: "Biological Sex",
      type: 'select',
      required: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'diverse', label: 'Diverse' },
      ],
    },
    {
      id: 'primary_goal',
      question: "What's your #1 longevity goal?",
      type: 'select',
      required: true,
      options: [
        { value: 'energy', label: 'More Energy' },
        { value: 'sleep', label: 'Better Sleep' },
        { value: 'stress', label: 'Less Stress' },
        { value: 'fat_loss', label: 'Fat Loss' },
        { value: 'strength_fitness', label: 'Strength & Fitness' },
        { value: 'focus_clarity', label: 'Focus & Clarity' },
      ],
    },
    {
      id: 'sleep_hours_bucket',
      question: "Average nightly sleep?",
      type: 'select',
      required: true,
      options: [
        { value: '<6', label: 'Less than 6 hours' },
        { value: '6-6.5', label: '6 - 6.5 hours' },
        { value: '6.5-7', label: '6.5 - 7 hours' },
        { value: '7-7.5', label: '7 - 7.5 hours' },
        { value: '7.5-8', label: '7.5 - 8 hours' },
        { value: '>8', label: 'More than 8 hours' },
      ],
    },
    {
      id: 'stress_1_10',
      question: "Current Stress Level (1-10)",
      type: 'range',
      min: 1,
      max: 10,
      required: true,
      helper: '1 = Zen master, 10 = About to explode'
    },
    {
      id: 'training_frequency',
      question: "Training sessions per week",
      type: 'select',
      required: true,
      options: [
        { value: '0', label: '0 times' },
        { value: '1-2', label: '1-2 times' },
        { value: '3-4', label: '3-4 times' },
        { value: '5+', label: '5+ times' },
      ],
    },
    {
      id: 'diet_pattern',
      question: "Dietary Habits (Select up to 5)",
      type: 'multiselect',
      required: true,
      max_select: 5,
      options: [
        { value: 'mostly_whole_foods', label: 'Mostly Whole Foods' },
        { value: 'high_ultra_processed', label: 'High Ultra-Processed' },
        { value: 'high_sugar_snacks', label: 'High Sugar/Snacks' },
        { value: 'frequent_alcohol', label: 'Frequent Alcohol' },
        { value: 'high_protein_focus', label: 'High Protein Focus' },
        { value: 'late_eating', label: 'Late Eating' },
      ],
    },

  ],
  optional: [
    {
      id: 'height_cm',
      question: "Height (cm)",
      type: 'number',
      min: 130,
      max: 220,
      required: false,
      placeholder: '175'
    },
    {
      id: 'weight_kg',
      question: "Weight (kg)",
      type: 'number',
      min: 40,
      max: 200,
      required: false,
      placeholder: '70'
    },
    {
      id: 'daily_time_budget',
      question: "Daily time budget (minutes)",
      type: 'select',
      required: false,
      options: [
        { value: '10', label: '10 minutes' },
        { value: '20', label: '20 minutes' },
        { value: '30', label: '30 minutes' },
      ],
    },
    {
      id: 'equipment_access',
      question: "Equipment Access",
      type: 'select',
      required: false,
      options: [
        { value: 'none', label: 'No equipment' },
        { value: 'basic', label: 'Basic home gym' },
        { value: 'gym', label: 'Full commercial gym' },
      ],
    },
  ],
};

function NumberField({ question, value, onChange, placeholder, helper, min, max }) {
  return (
    <div className="space-y-3">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          // Only allow numeric input
          if (val === '' || /^\d+$/.test(val)) {
            onChange(val);
          }
        }}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none"
      />
      {helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function RangeField({ question, value, onChange, min, max, helper }) {
  const displayValue = value || Math.ceil((max - min) / 2) + min;

  return (
    <div className="space-y-4">
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

function TextField({ question, value, onChange, placeholder, helper }) {
  return (
    <div className="space-y-3">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
      />
      {helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function TelField({ question, value, onChange, placeholder, helper }) {
  const [error, setError] = React.useState('');

  // Validate phone number format (must start with +)
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return '';
    }

    // Must start with + for international format
    if (!phone.startsWith('+')) {
      return 'Phone number must include country code (e.g., +1, +49, +43)';
    }

    // Remove + and spaces to check if rest is numeric
    const digitsOnly = phone.slice(1).replace(/[\s-]/g, '');
    if (!/^\d+$/.test(digitsOnly)) {
      return 'Phone number must contain only digits after country code';
    }

    // Minimum length check (country code + at least 7 digits)
    if (digitsOnly.length < 7) {
      return 'Phone number is too short';
    }

    // Maximum length check (reasonable international number)
    if (digitsOnly.length > 15) {
      return 'Phone number is too long';
    }

    return '';
  };

  const handleChange = (newValue) => {
    onChange(newValue);
    const validationError = validatePhoneNumber(newValue);
    setError(validationError);
  };

  const handleBlur = () => {
    const validationError = validatePhoneNumber(value);
    setError(validationError);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <input
        type="tel"
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${error
          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
          : 'border-slate-700 focus:ring-amber-400 focus:border-transparent'
          }`}
      />
      {error && <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>}
      {!error && helper && <p className="text-slate-500 text-sm">{helper}</p>}
    </div>
  );
}

function SelectField({ question, value, onChange, options }) {
  return (
    <div className="space-y-3">
      <label className="block text-xl font-medium text-white">
        {question}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-lg border text-left text-sm transition-all ${value === option.value
              ? 'bg-amber-400/10 border-amber-400 text-amber-400'
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

function MultiSelectField({ question, value = [], onChange, options, max_select }) {
  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (max_select && value.length >= max_select) return; // Prevent selection over max
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
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
            className={`p-3 rounded-lg border text-left text-sm transition-all ${value.includes(option.value)
              ? 'bg-amber-400/10 border-amber-400 text-amber-400'
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

// WhatsApp Consent Checkbox (for future messaging feature)
function ConsentCheckbox({ checked, onChange }) {
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-11 h-11 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400 focus:ring-offset-slate-900"
        />
        <span className="text-slate-300 text-sm leading-relaxed">
          I agree to receive notifications about my longevity plan. I can unsubscribe anytime.
        </span>
      </label>
    </div>
  );
}

import { useDocumentTitle } from '../hooks/useDocumentTitle';


export default function IntakePage() {
  useDocumentTitle('Design Your Plan - ExtensioVitae');
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  // Initialize with default values for range fields
  const [formData, setFormData] = useState({
    stress_1_10: 5, // Default stress level so the form is valid
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [skipFields, setSkipFields] = useState([]); // Fields to skip for authenticated users

  // Load user profile and previous intake data for authenticated users
  useEffect(() => {
    async function loadUserData() {
      // If we don't have a user yet, show all fields
      if (!user) {
        logger.debug('[Intake] No user detected, showing all fields');
        return;
      }

      // Start loading user data for authenticated users
      setIsLoadingUserData(true);
      logger.debug('[Intake] Authenticated user detected, loading profile data...', { userId: user.id });

      try {
        // Get user profile
        const profile = await getUserProfile(user.id);
        logger.debug('[Intake] User profile:', profile);

        // Get previous intake data
        const previousIntake = await getIntake();
        logger.debug('[Intake] Previous intake:', previousIntake);

        const preFillData = {};
        const fieldsToSkip = [];

        // Pre-fill name from user profile OR previous intake
        if (profile?.name && profile.name.trim().length > 0) {
          preFillData.name = profile.name;
          fieldsToSkip.push('name');
          logger.debug('[Intake] Pre-filling name from profile:', profile.name);
        } else if (previousIntake?.name && previousIntake.name.trim().length > 0) {
          preFillData.name = previousIntake.name;
          fieldsToSkip.push('name');
          logger.debug('[Intake] Pre-filling name from previous intake:', previousIntake.name);
        }

        // Pre-fill sex from previous intake if available
        if (previousIntake?.sex && previousIntake.sex.trim().length > 0) {
          preFillData.sex = previousIntake.sex;
          fieldsToSkip.push('sex');
          logger.debug('[Intake] Pre-filling sex from previous intake:', previousIntake.sex);
        }

        // Pre-fill age and phone_number from previous intake if available
        if (previousIntake?.age) {
          preFillData.age = previousIntake.age;
          fieldsToSkip.push('age');
          logger.debug('[Intake] Pre-filling age from previous intake:', previousIntake.age);
        }


        // Update form data with pre-filled values
        if (Object.keys(preFillData).length > 0) {
          setFormData(prev => ({ ...prev, ...preFillData }));
          setSkipFields(fieldsToSkip);
          logger.debug('[Intake] ✅ Pre-filled fields:', fieldsToSkip);
          logger.debug('[Intake] ✅ Pre-filled data:', preFillData);
        } else {
          logger.debug('[Intake] ⚠️ No data to pre-fill (profile or previous intake missing)');
        }
      } catch (error) {
        console.error('[Intake] ❌ Error loading user data:', error);
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
      case 'text':
        return <TextField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'number':
        return <NumberField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'range':
        return <RangeField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'tel':
        return <TelField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'select':
        return <SelectField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      case 'multiselect':
        return <MultiSelectField key={q.id} {...q} value={formData[q.id]} onChange={(val) => updateField(q.id, val)} />;
      default:
        return null;
    }
  };

  const getValidationErrors = () => {
    const errors = [];

    // Check mandatory fields
    for (const q of QUESTIONS.mandatory) {
      // Skip validation for pre-filled fields (for authenticated users)
      if (skipFields.includes(q.id)) {
        logger.debug(`[Intake] Skipping validation for pre-filled field: ${q.id}`);
        continue;
      }

      if (q.required) {
        const val = formData[q.id];

        // Basic presence check
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          errors.push(`Missing field: ${q.question}`);
          continue;
        }

        // Validation for numbers
        if (q.type === 'number') {
          const num = Number(val);
          if (isNaN(num)) errors.push(`${q.question} must be a number`);
          else if (q.min !== undefined && num < q.min) errors.push(`${q.question} must be at least ${q.min}`);
          else if (q.max !== undefined && num > q.max) errors.push(`${q.question} must be at most ${q.max}`);
        }

        // Validation for phone numbers (WhatsApp format)
        if (q.type === 'tel') {
          const phone = val.trim();

          // Must start with + for international format
          if (!phone.startsWith('+')) {
            errors.push(`${q.question} must include country code (e.g., +1, +49, +43)`);
          } else {
            // Remove + and spaces to check if rest is numeric
            const digitsOnly = phone.slice(1).replace(/[\s-]/g, '');

            if (!/^\d+$/.test(digitsOnly)) {
              errors.push(`${q.question} must contain only digits after country code`);
            } else if (digitsOnly.length < 7) {
              errors.push(`${q.question} is too short (minimum 7 digits after country code)`);
            } else if (digitsOnly.length > 15) {
              errors.push(`${q.question} is too long (maximum 15 digits)`);
            }
          }
        }

        // Validation for multiselect
        if (q.type === 'multiselect') {
          if (!Array.isArray(val) || val.length === 0) errors.push(`Please select at least one option for ${q.question}`);
        }
      }
    }

    // Check consent
    if (!formData.whatsapp_consent) {
      errors.push('Please accept the WhatsApp consent');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      addToast(errors[0], 'error'); // Show first error prominently
      if (errors.length > 1) {
        addToast(`And ${errors.length - 1} more issues...`, 'warning');
      }
      // Log specific errors for debugging if needed, or maybe show them all?
      // errors.forEach(err => addToast(err, 'error', 5000)); // might be too many
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      whatsapp_consent: formData.whatsapp_consent || false,
      submitted_at: new Date().toISOString(),
    };

    try {
      // Save using DataService (auto Supabase/localStorage)
      await saveIntake(payload);
      logger.debug('[Intake] Data saved successfully');

      // Track analytics event
      trackIntakeCompleted(payload);

      // Navigate to generating page
      window.location.href = '/generating';
    } catch (error) {
      console.error('[Intake] Error saving intake:', error);
      // Still navigate - localStorage backup was saved
      window.location.href = '/generating';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 sticky top-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-white tracking-tight">
            Extensio<span className="text-amber-400">Vitae</span>
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Progress Bar */}
          <ProgressBar
            currentStep={1}
            totalSteps={3}
            stepLabels={['Basics', 'Lifestyle', 'Preferences']}
          />

          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Design Your Blueprint
            </h1>
            <p className="text-slate-400 text-lg">
              We've updated our intake to better personalize your longevity plan.
            </p>
          </div>

          {/* Loading state while user data is loading */}
          {isLoadingUserData && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
              <p className="text-slate-400 mt-4">Loading your profile...</p>
            </div>
          )}

          {/* Show form when not loading user data */}
          {!isLoadingUserData && <div className="space-y-12">
            {/* Info message for authenticated users with pre-filled data */}
            {isAuthenticated && skipFields.length > 0 && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
                <p className="text-amber-400 text-sm font-medium">
                  Welcome back! We've pre-filled your personal information from your profile.
                </p>
              </div>
            )}

            {/* Mandatory Questions */}
            <div className="space-y-10">
              {QUESTIONS.mandatory
                .filter(q => !skipFields.includes(q.id))
                .map(q => getQuestionComponent(q))}
            </div>

            <hr className="border-slate-800" />

            {/* Optional Questions */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-medium text-white">Fine-tune your plan</h3>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">Optional</span>
              </div>
              {QUESTIONS.optional.map(q => getQuestionComponent(q))}
            </div>

            <hr className="border-slate-800" />

            {/* Consent & Submit */}
            <div className="space-y-8 bg-slate-900 pb-10">
              <ConsentCheckbox
                checked={formData.whatsapp_consent || false}
                onChange={(val) => updateField('whatsapp_consent', val)}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl text-lg font-medium transition-all transform ${!isSubmitting
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 hover:scale-[1.02] shadow-lg shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? 'Generating Your Plan...' : 'Generate My Blueprint'}
              </button>

              <p className="text-center text-slate-500 text-sm">
                Please complete all required fields (Age 18-80) and accept the WhatsApp consent.
              </p>
            </div>
          </div>}
        </div>
      </main>
    </div>
  );
}
