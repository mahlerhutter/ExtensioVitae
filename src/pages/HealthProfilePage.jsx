import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getHealthProfile,
    updateExtendedHealthProfile,
    CHRONIC_CONDITIONS,
    INJURIES_LIMITATIONS,
    DIETARY_RESTRICTIONS,
    calculatePlanConstraints,
    generateConstraintsSummary
} from '../lib/profileService';
import { useToast } from '../components/Toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Health Profile Settings Page
 * Allows users to add extended health information for personalized plans
 */
export default function HealthProfilePage() {
    useDocumentTitle('Health Profile - ExtensioVitae');
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [healthProfile, setHealthProfile] = useState(null);
    const [constraints, setConstraints] = useState(null);

    // Form state
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

    // Load existing health profile
    useEffect(() => {
        async function loadProfile() {
            if (!user) return;

            try {
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
            } catch (error) {
                console.error('Error loading health profile:', error);
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

    // Handle form submission
    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            await updateExtendedHealthProfile(user.id, formData);
            setSaveSuccess(true);

            // Recalculate constraints
            const profile = await getHealthProfile(user.id);
            const calc = calculatePlanConstraints(profile);
            setConstraints(generateConstraintsSummary(calc));

            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving health profile:', error);
            addToast('Fehler beim Speichern. Bitte versuche es erneut.', 'error');
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
