import React, { useState, useEffect } from 'react';

/**
 * Edit Profile Modal Component
 * Full profile editing form with validation
 */
export default function EditProfileModal({ isOpen, onClose, initialData, onSave }) {
    const [formData, setFormData] = useState(initialData || {});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-semibold text-white">Profil bearbeiten</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Personal Info Group */}
                    <div className="space-y-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">Persönliche Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Dein Name" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Email</label>
                                <input name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="deine@email.de" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Telefon / WhatsApp</label>
                                <input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="+49 170 1234567" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Alter</label>
                                <input name="age" type="number" value={formData.age || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Größe (cm)</label>
                                <input name="height_cm" type="number" value={formData.height_cm || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" placeholder="175" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Gewicht (kg)</label>
                                <input name="weight_kg" type="number" value={formData.weight_kg || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" placeholder="70" />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Preferences */}
                    <div className="space-y-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">WhatsApp Einstellungen</h3>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input name="whatsapp_consent" type="checkbox" checked={formData.whatsapp_consent || false} onChange={handleChange} className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400" />
                                <span className="text-slate-300 text-sm">WhatsApp-Updates aktiv</span>
                            </label>
                        </div>
                    </div>

                    {/* Goals & Physiology */}
                    <div className="space-y-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">Ziele & Physiologie</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Hauptziel</label>
                                <select name="primary_goal" value={formData.primary_goal || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none appearance-none">
                                    <option value="energy">Mehr Energie</option>
                                    <option value="sleep">Besserer Schlaf</option>
                                    <option value="stress">Weniger Stress</option>
                                    <option value="fat_loss">Fettabbau</option>
                                    <option value="strength_fitness">Kraft & Fitness</option>
                                    <option value="focus_clarity">Fokus & Klarheit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Schlaf (Stunden)</label>
                                <select name="sleep_hours_bucket" value={formData.sleep_hours_bucket || ''} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white outline-none">
                                    <option value="<6">Unter 6</option>
                                    <option value="6-6.5">6 - 6.5</option>
                                    <option value="6.5-7">6.5 - 7</option>
                                    <option value="7-7.5">7 - 7.5</option>
                                    <option value="7.5-8">7.5 - 8</option>
                                    <option value=">8">Über 8</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Stress (1-10)</label>
                                <input name="stress_1_10" type="number" min="1" max="10" value={formData.stress_1_10 || 5} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Training / Woche</label>
                                <select name="training_frequency" value={formData.training_frequency || ''} onChange={handleChange} className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white outline-none">
                                    <option value="0">0 mal</option>
                                    <option value="1-2">1-2 mal</option>
                                    <option value="3-4">3-4 mal</option>
                                    <option value="5+">5+ mal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Zeitbudget (min)</label>
                                <input name="daily_time_budget" type="number" value={formData.daily_time_budget || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg text-slate-400 hover:text-white transition-colors">Abbrechen</button>
                        <button type="submit" className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/10">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
