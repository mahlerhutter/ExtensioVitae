import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getHealthProfile,
    updateExtendedHealthProfile,
    getUserProfile,
    upsertUserProfile,
    CHRONIC_CONDITIONS,
    INJURIES_LIMITATIONS,
    DIETARY_RESTRICTIONS,
    calculatePlanConstraints,
    generateConstraintsSummary
} from '../lib/profileService';
import { getIntake, saveIntake } from '../lib/dataService';
import { useToast } from '../components/Toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { logger } from '../lib/logger';

/**
 * Health Profile Settings Page
 * Comprehensive health data management including:
 * - Core metrics (weight, height, goals, sleep, stress, training)
 * - Lifestyle factors (smoking, alcohol)
 * - Medical conditions and limitations
 * - Dietary restrictions
 */
export default function HealthProfilePage() {
    useDocumentTitle('Gesundheitsprofil - ExtensioVitae');
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [healthProfile, setHealthProfile] = useState(null);
    const [constraints, setConstraints] = useState(null);

    // Core health metrics form state
    const [coreData, setCoreData] = useState({
        height_cm: '',
        weight_kg: '',
        primary_goal: 'energy',
        sleep_hours_bucket: '7-7.5',
        stress_1_10: 5,
        training_frequency: '1-2',
        daily_time_budget: 15
    });

    // Extended health form state
    const [formData, setFormData] = useState({
        is_smoker: false,
        smoking_frequency: 'never',
        alcohol_frequency: 'rarely',
        chronic_conditions: [],
        injuries_limitations: [],
        dietary_restrictions: [],
        menopause_status: 'not_applicable',
        takes_medications: false,
        medication_notes: ''
    });

    // Load existing health profile and core data
    useEffect(() => {
        async function loadProfile() {
            if (!user) return;

            try {
                // Load extended health profile
                const profile = await getHealthProfile(user.id);
                if (profile) {
                    setHealthProfile(profile);
                    setFormData({
                        is_smoker: profile.is_smoker || false,
                        smoking_frequency: profile.smoking_frequency || 'never',
                        alcohol_frequency: profile.alcohol_frequency || 'rarely',
                        chronic_conditions: profile.chronic_conditions || [],
                        injuries_limitations: profile.injuries_limitations || [],
                        dietary_restrictions: profile.dietary_restrictions || [],
                        menopause_status: profile.menopause_status || 'not_applicable',
                        takes_medications: profile.takes_medications || false,
                        medication_notes: profile.medication_notes || ''
                    });

                    // Calculate constraints for preview
                    const calc = calculatePlanConstraints(profile);
                    setConstraints(generateConstraintsSummary(calc));
                }

                // Load core health metrics from intake data
                const intakeData = await getIntake();
                if (intakeData) {
                    setCoreData({
                        height_cm: intakeData.height_cm || '',
                        weight_kg: intakeData.weight_kg || '',
                        primary_goal: intakeData.primary_goal || 'energy',
                        sleep_hours_bucket: intakeData.sleep_hours_bucket || '7-7.5',
                        stress_1_10: intakeData.stress_1_10 || 5,
                        training_frequency: intakeData.training_frequency || '1-2',
                        daily_time_budget: intakeData.daily_time_budget || 15
                    });
                }

                // Also try to load from user profile (as fallback for height/weight)
                try {
                    const userProfile = await getUserProfile(user.id);
                    if (userProfile) {
                        setCoreData(prev => ({
                            ...prev,
                            height_cm: prev.height_cm || userProfile.height_cm || '',
                            weight_kg: prev.weight_kg || userProfile.weight_kg || ''
                        }));
                    }
                } catch (err) {
                    logger.warn('Could not load user profile:', err);
                }
            } catch (error) {
                logger.error('Error loading health profile:', error);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user]);

    // Handle checkbox toggle for arrays
    const toggleArrayValue = (field, value) => {
        setFormData(prev => {
            const current = prev[field] || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    // Handle core data changes
    const handleCoreChange = (e) => {
        const { name, value } = e.target;
        setCoreData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission - saves both core and extended data
    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setSaveSuccess(false);
        let savedSomething = false;

        try {
            // 1. Save core health metrics to intake data (always works - localStorage fallback)
            const currentIntake = await getIntake() || {};
            const updatedIntake = {
                ...currentIntake,
                height_cm: coreData.height_cm,
                weight_kg: coreData.weight_kg,
                primary_goal: coreData.primary_goal,
                sleep_hours_bucket: coreData.sleep_hours_bucket,
                stress_1_10: parseInt(coreData.stress_1_10) || 5,
                training_frequency: coreData.training_frequency,
                daily_time_budget: parseInt(coreData.daily_time_budget) || 15,
                // Also store lifestyle data in intake for fallback
                is_smoker: formData.is_smoker,
                smoking_frequency: formData.smoking_frequency,
                alcohol_frequency: formData.alcohol_frequency
            };
            await saveIntake(updatedIntake);
            savedSomething = true;
            logger.debug('[HealthProfile] Intake data saved');

            // 2. Try to update user profile with height/weight (may fail if table doesn't exist)
            try {
                await upsertUserProfile(user.id, {
                    height_cm: coreData.height_cm ? parseInt(coreData.height_cm) : null,
                    weight_kg: coreData.weight_kg ? parseInt(coreData.weight_kg) : null
                });
                logger.debug('[HealthProfile] User profile updated');
            } catch (err) {
                logger.warn('[HealthProfile] Could not update user profile (table may not exist):', err.message);
            }

            // 3. Try to save extended health profile (may fail if table doesn't exist)
            try {
                await updateExtendedHealthProfile(user.id, formData);
                logger.debug('[HealthProfile] Extended health profile saved');

                // Recalculate constraints if extended save worked
                const profile = await getHealthProfile(user.id);
                if (profile) {
                    const calc = calculatePlanConstraints(profile);
                    setConstraints(generateConstraintsSummary(calc));
                }
            } catch (err) {
                logger.warn('[HealthProfile] Could not save extended health profile (migration may be pending):', err.message);
                // This is not a fatal error - intake data was saved
            }

            setSaveSuccess(true);
            addToast('Gesundheitsprofil gespeichert!', 'success');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            logger.error('Error saving health profile:', error);
            if (savedSomething) {
                addToast('Teilweise gespeichert. Manche Daten konnten nicht gespeichert werden.', 'warning');
            } else {
                addToast('Fehler beim Speichern. Bitte versuche es erneut.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/dashboard" className="text-xl font-semibold text-white tracking-tight">
                        Extensio<span className="text-amber-400">Vitae</span>
                    </a>
                    <a href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                        ← Zurück zum Dashboard
                    </a>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Page Title */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        🩺 Gesundheitsprofil
                    </h1>
                    <p className="text-slate-400">
                        Optionale Angaben für einen noch besser personalisierten Plan.
                        Alle Daten werden vertraulich behandelt.
                    </p>
                </div>

                {/* Constraint Preview */}
                {constraints?.hasRestrictions && (
                    <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                            <span>⚡</span> Dein Plan wird angepasst
                        </h3>
                        {constraints.intensityNote && (
                            <p className="text-slate-300 mb-3">{constraints.intensityNote}</p>
                        )}
                        {constraints.topWarnings.length > 0 && (
                            <ul className="space-y-1">
                                {constraints.topWarnings.map((warning, idx) => (
                                    <li key={idx} className="text-slate-400 text-sm flex items-center gap-2">
                                        <span className="text-amber-400">•</span>
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div className="space-y-10">
                    {/* Core Health Metrics Section */}
                    <Section title="Basis-Daten" icon="📊">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Height & Weight */}
                            <div>
                                <label className="block text-white font-medium mb-2">Größe (cm)</label>
                                <input
                                    name="height_cm"
                                    type="number"
                                    value={coreData.height_cm}
                                    onChange={handleCoreChange}
                                    placeholder="175"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>
                            <div>
                                <label className="block text-white font-medium mb-2">Gewicht (kg)</label>
                                <input
                                    name="weight_kg"
                                    type="number"
                                    value={coreData.weight_kg}
                                    onChange={handleCoreChange}
                                    placeholder="70"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>

                            {/* Primary Goal */}
                            <div className="sm:col-span-2">
                                <label className="block text-white font-medium mb-2">Hauptziel</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { value: 'energy', label: '⚡ Mehr Energie' },
                                        { value: 'sleep', label: '😴 Besserer Schlaf' },
                                        { value: 'stress', label: '🧘 Weniger Stress' },
                                        { value: 'fat_loss', label: '🔥 Fettabbau' },
                                        { value: 'strength_fitness', label: '💪 Kraft & Fitness' },
                                        { value: 'focus_clarity', label: '🧠 Fokus & Klarheit' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setCoreData(prev => ({ ...prev, primary_goal: opt.value }))}
                                            className={`p-3 rounded-lg border text-sm text-left transition-all ${coreData.primary_goal === opt.value
                                                ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sleep Hours */}
                            <div>
                                <label className="block text-white font-medium mb-2">Schlaf (Stunden/Nacht)</label>
                                <select
                                    name="sleep_hours_bucket"
                                    value={coreData.sleep_hours_bucket}
                                    onChange={handleCoreChange}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    <option value="<6">Unter 6 Stunden</option>
                                    <option value="6-6.5">6 - 6.5 Stunden</option>
                                    <option value="6.5-7">6.5 - 7 Stunden</option>
                                    <option value="7-7.5">7 - 7.5 Stunden</option>
                                    <option value="7.5-8">7.5 - 8 Stunden</option>
                                    <option value=">8">Über 8 Stunden</option>
                                </select>
                            </div>

                            {/* Stress Level */}
                            <div>
                                <label className="block text-white font-medium mb-2">Stress-Level (1-10)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        name="stress_1_10"
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={coreData.stress_1_10}
                                        onChange={handleCoreChange}
                                        className="flex-1 accent-amber-400"
                                    />
                                    <span className={`w-8 text-center font-bold ${coreData.stress_1_10 <= 3 ? 'text-green-400' :
                                            coreData.stress_1_10 <= 6 ? 'text-amber-400' :
                                                'text-red-400'
                                        }`}>
                                        {coreData.stress_1_10}
                                    </span>
                                </div>
                            </div>

                            {/* Training Frequency */}
                            <div>
                                <label className="block text-white font-medium mb-2">Training / Woche</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { value: '0', label: '0x' },
                                        { value: '1-2', label: '1-2x' },
                                        { value: '3-4', label: '3-4x' },
                                        { value: '5+', label: '5+' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setCoreData(prev => ({ ...prev, training_frequency: opt.value }))}
                                            className={`p-2.5 rounded-lg border text-sm transition-all ${coreData.training_frequency === opt.value
                                                ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Budget */}
                            <div>
                                <label className="block text-white font-medium mb-2">Zeitbudget pro Tag (Minuten)</label>
                                <input
                                    name="daily_time_budget"
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={coreData.daily_time_budget}
                                    onChange={handleCoreChange}
                                    placeholder="15"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                                <p className="text-slate-500 text-xs mt-1">Wie viel Zeit hast du täglich für Gesundheitsroutinen?</p>
                            </div>
                        </div>
                    </Section>

                    {/* Lifestyle Section */}
                    <Section title="Lifestyle" icon="🚬">
                        {/* Smoking */}
                        <div className="space-y-3">
                            <label className="block text-white font-medium">Rauchst du?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { value: 'never', label: 'Nie' },
                                    { value: 'former', label: 'Früher' },
                                    { value: 'occasional', label: 'Gelegentlich' },
                                    { value: 'daily', label: 'Täglich' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            smoking_frequency: opt.value,
                                            is_smoker: opt.value === 'occasional' || opt.value === 'daily'
                                        }))}
                                        className={`p-3 rounded-lg border text-sm transition-all ${formData.smoking_frequency === opt.value
                                            ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alcohol */}
                        <div className="space-y-3 mt-6">
                            <label className="block text-white font-medium">Alkoholkonsum</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { value: 'never', label: 'Nie' },
                                    { value: 'rarely', label: 'Selten' },
                                    { value: 'weekly', label: 'Wöchentlich' },
                                    { value: 'daily', label: 'Täglich' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData(prev => ({ ...prev, alcohol_frequency: opt.value }))}
                                        className={`p-3 rounded-lg border text-sm transition-all ${formData.alcohol_frequency === opt.value
                                            ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Chronic Conditions */}
                    <Section title="Chronische Erkrankungen" icon="🏥">
                        <p className="text-slate-400 text-sm mb-4">
                            Wir passen deinen Plan automatisch an, um sichere Übungen zu empfehlen.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(CHRONIC_CONDITIONS).map(([key, config]) => (
                                <CheckboxCard
                                    key={key}
                                    label={config.label}
                                    checked={formData.chronic_conditions.includes(key)}
                                    onChange={() => toggleArrayValue('chronic_conditions', key)}
                                    category={config.category}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Injuries & Limitations */}
                    <Section title="Verletzungen & Einschränkungen" icon="🩹">
                        <p className="text-slate-400 text-sm mb-4">
                            Wir vermeiden Übungen, die diese Bereiche belasten.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(INJURIES_LIMITATIONS).map(([key, config]) => (
                                <CheckboxCard
                                    key={key}
                                    label={config.label}
                                    checked={formData.injuries_limitations.includes(key)}
                                    onChange={() => toggleArrayValue('injuries_limitations', key)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Dietary Restrictions */}
                    <Section title="Ernährungseinschränkungen" icon="🥗">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(DIETARY_RESTRICTIONS).map(([key, config]) => (
                                <CheckboxCard
                                    key={key}
                                    label={config.label}
                                    checked={formData.dietary_restrictions.includes(key)}
                                    onChange={() => toggleArrayValue('dietary_restrictions', key)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Medications */}
                    <Section title="Medikamente" icon="💊">
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.takes_medications}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        takes_medications: e.target.checked
                                    }))}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
                                />
                                <span className="text-white">Ich nehme regelmäßig Medikamente</span>
                            </label>

                            {formData.takes_medications && (
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">
                                        Hinweise (optional, z.B. Blutdrucksenker, Blutverdünner)
                                    </label>
                                    <textarea
                                        value={formData.medication_notes}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            medication_notes: e.target.value
                                        }))}
                                        placeholder="z.B. Beta-Blocker morgens..."
                                        rows={3}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Save Button */}
                    <div className="pt-6 border-t border-slate-800">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full py-4 rounded-xl text-lg font-medium transition-all ${saving
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : saveSuccess
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                                }`}
                        >
                            {saving ? 'Speichern...' : saveSuccess ? '✓ Gespeichert!' : 'Profil speichern'}
                        </button>

                        <p className="text-center text-slate-500 text-sm mt-4">
                            Dein nächster Plan wird automatisch an dein Gesundheitsprofil angepasst.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function Section({ title, icon, children }) {
    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span>{icon}</span>
                {title}
            </h2>
            {children}
        </div>
    );
}

function CheckboxCard({ label, checked, onChange, category }) {
    const categoryColors = {
        metabolic: 'border-l-blue-500',
        cardiovascular: 'border-l-red-500',
        cancer: 'border-l-purple-500',
        respiratory: 'border-l-cyan-500',
        musculoskeletal: 'border-l-orange-500',
        mental_health: 'border-l-pink-500',
        default: 'border-l-slate-600'
    };

    const borderColor = categoryColors[category] || categoryColors.default;

    return (
        <button
            onClick={onChange}
            className={`p-4 rounded-lg border-l-4 text-left transition-all ${borderColor} ${checked
                ? 'bg-amber-400/10 border border-amber-400 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked
                    ? 'bg-amber-400 border-amber-400'
                    : 'border-slate-600'
                    }`}>
                    {checked && (
                        <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <span className="text-sm">{label}</span>
            </div>
        </button>
    );
}
