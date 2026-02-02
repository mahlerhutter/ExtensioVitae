import React, { useState } from 'react';

/**
 * User Profile Section Component
 * Displays user profile information with expandable details
 */
export default function UserProfileSection({ intakeData, email, onEdit }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!intakeData) return null;

    const labels = {
        name: 'Name',
        age: 'Alter',
        sex: 'Geschlecht',
        primary_goal: 'Hauptziel',
        sleep_hours_bucket: 'Schlaf (h)',
        stress_1_10: 'Stress (1-10)',
        training_frequency: 'Training/Woche',
        diet_pattern: 'Ernährung',
        daily_time_budget: 'Zeitbudget',
        equipment_access: 'Equipment',
        height_cm: 'Größe (cm)',
        weight_kg: 'Gewicht (kg)',
        submitted_at: 'Erstellt am'
    };

    const formatValue = (key, value) => {
        if (key === 'sex') return value === 'male' ? 'Männlich' : 'Weiblich';
        if (key === 'primary_goal') {
            const goals = { sleep: 'Besserer Schlaf', stress: 'Weniger Stress', energy: 'Mehr Energie', fat_loss: 'Fettabbau', strength_fitness: 'Kraft/Fitness', focus_clarity: 'Fokus/Klarheit' };
            return goals[value] || value;
        }
        if (key === 'diet_pattern' && Array.isArray(value)) {
            const patterns = { high_ultra_processed: 'Viel Verarbeitetes', high_sugar_snacks: 'Viel Zucker', frequent_alcohol: 'Häufig Alkohol', late_eating: 'Spät essen', mostly_whole_foods: 'Meist Vollwertkost', high_protein_focus: 'Proteinreich' };
            return value.map(v => patterns[v] || v).join(', ') || 'Keine Angabe';
        }
        if (key === 'equipment_access') {
            const eq = { none: 'Kein Equipment', basic: 'Basis', gym: 'Fitnessstudio' };
            return eq[value] || value;
        }
        if (key === 'submitted_at') {
            return new Date(value).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        if (key === 'stress_1_10') return `${value}/10`;
        return value;
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-2xl text-amber-400 font-bold border border-slate-700 shadow-inner">
                        {intakeData.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight">{intakeData.name}</h2>
                        <div className="flex items-center gap-4 text-sm mt-1.5 ">
                            <span className="text-slate-400 flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded">
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {intakeData.phone_number || 'Keine Nummer'}
                            </span>
                            {email && (
                                <span className="text-slate-400 flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {email}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${intakeData.whatsapp_consent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {intakeData.whatsapp_consent ? (
                                    <>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        WhatsApp Aktiv
                                    </>
                                ) : 'WhatsApp Inaktiv'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onEdit}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 hover:border-amber-400/50 hover:bg-slate-800"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Bearbeiten
                    </button>
                    <a
                        href="/?noredirect=true"
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Startseite
                    </a>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg"
                    >
                        {isExpanded ? 'Details verbergen' : 'Details anzeigen'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                        {Object.entries(intakeData).filter(([key]) => labels[key]).map(([key, value]) => (
                            <div key={key}>
                                <span className="block text-slate-500 text-xs mb-1 font-medium uppercase tracking-wider">{labels[key]}</span>
                                <span className="block text-slate-200 text-sm font-medium">{formatValue(key, value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
