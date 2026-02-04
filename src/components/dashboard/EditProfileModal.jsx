import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Edit Profile Modal Component
 * User account data only (Name, Email, Phone, Age)
 * Health data is managed in HealthProfilePage
 */
export default function EditProfileModal({ isOpen, onClose, initialData, onSave }) {
    const [formData, setFormData] = useState(initialData || {});
    const navigate = useNavigate();

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

    const goToHealthProfile = () => {
        onClose();
        navigate('/health-profile');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-semibold text-white">Mein Profil</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Personal Account Info */}
                    <div className="space-y-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">Kontodaten</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="Dein Name" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Email</label>
                                <input name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="deine@email.de" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Telefon / WhatsApp</label>
                                <input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-1 focus:ring-amber-400 outline-none" placeholder="+49 170 1234567" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Alter</label>
                                <input name="age" type="number" value={formData.age || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white outline-none" placeholder="35" />
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Preferences */}
                    <div className="space-y-4">
                        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">Benachrichtigungen</h3>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input name="whatsapp_consent" type="checkbox" checked={formData.whatsapp_consent || false} onChange={handleChange} className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400" />
                                <span className="text-slate-300 text-sm">WhatsApp-Updates aktiv</span>
                            </label>
                        </div>
                    </div>

                    {/* Link to Health Profile */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">🩺 Gesundheitsdaten</p>
                                <p className="text-slate-400 text-xs mt-0.5">Gewicht, Ziele, Lifestyle & mehr</p>
                            </div>
                            <button
                                type="button"
                                onClick={goToHealthProfile}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                            >
                                Bearbeiten →
                            </button>
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
