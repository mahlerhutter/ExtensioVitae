import React from 'react';

/**
 * Plan History Modal Component
 * Shows archived plans with load functionality
 */
export default function PlanHistoryModal({ isOpen, onClose, plans, onLoadPlan, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-semibold text-white">Vergangene Pläne</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button>
                </div>
                <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">
                            Lade Historie...
                        </div>
                    ) : plans.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">Keine vergangenen Pläne gefunden.</p>
                    ) : (
                        plans.map(p => (
                            <div
                                key={p.supabase_plan_id}
                                onClick={() => { onLoadPlan(p); onClose(); }}
                                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer group flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium text-slate-200 group-hover:text-amber-400 transition-colors mb-1">
                                        Erstellt: {new Date(p.created_at).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </div>
                                    {p.updated_at && (
                                        <div className="text-xs text-slate-500 mb-2">
                                            Inaktiv seit: {new Date(p.updated_at).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                        </div>
                                    )}
                                    <div className="text-sm text-slate-400 line-clamp-1">{p.plan_summary}</div>
                                </div>
                                <div className="text-slate-500 text-sm">
                                    →
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
