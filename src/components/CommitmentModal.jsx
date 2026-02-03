import React, { useState, useEffect } from 'react';

export default function CommitmentModal({ isOpen, onCommit }) {
    const [name, setName] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure render transition
            setTimeout(() => setShow(true), 50);
        }
    }, [isOpen]);

    const handleCommit = () => {
        if (!name.trim()) return;

        // Save to local storage
        localStorage.setItem('has_signed_contract', 'true');
        localStorage.setItem('contract_signer_name', name);

        // Trigger exit animation
        setShow(false);

        // Callback after animation
        setTimeout(() => {
            onCommit();
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Modal Card */}
            <div className={`relative w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-sm p-8 md:p-12 transform transition-all duration-700 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-1 bg-amber-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-serif text-white tracking-wide mb-2">
                        PROTOCOL COMMITMENT
                    </h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">
                        Binding Agreement
                    </p>
                </div>

                {/* Contract Text */}
                <div className="font-serif text-slate-300 text-lg leading-relaxed mb-10 text-center">
                    <p>
                        I, <span className="text-white border-b border-slate-600 px-2 italic">{name || '___________'}</span>,
                        commit to prioritizing my biology for the next 30 days.
                    </p>
                    <p className="mt-4 text-sm text-slate-500 italic">
                        I understand that consistency is the only currency that matters.
                    </p>
                </div>

                {/* Input */}
                <div className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Sign your full name"
                            className="w-full bg-slate-800/50 border-b-2 border-slate-700 focus:border-amber-400 px-4 py-3 text-center text-white placeholder-slate-600 focus:outline-none transition-colors font-serif text-xl"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleCommit}
                        disabled={!name.trim()}
                        className={`w-full py-4 px-6 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${name.trim()
                                ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 transform hover:scale-[1.02]'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        Unlock My Plan
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600 font-mono">
                        SECURE SIGNATURE ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
}
