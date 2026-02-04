import React from 'react';
import { PROTOCOL_PACKS } from '../../lib/protocolPacks';

/**
 * Protocol Library Component
 * Displays available "One-Tap" protocol packs for specific scenarios.
 */
export default function ProtocolLibrary({ onActivatePack, activePackId }) {
    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-amber-400">⚡</span>
                    Protocol Library
                </h3>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    One-Tap Activation
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PROTOCOL_PACKS.map((pack) => {
                    const isActive = activePackId === pack.id;

                    return (
                        <button
                            key={pack.id}
                            onClick={() => onActivatePack(pack)}
                            className={`relative text-left p-4 rounded-2xl border transition-all group ${isActive
                                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20'
                                }`}
                        >
                            {/* Status Indicator */}
                            {isActive && (
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-500 uppercase">Aktiv</span>
                                </div>
                            )}

                            {/* Icon & Category */}
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform ${isActive ? 'bg-amber-500/20' : ''}`}>
                                    {pack.icon}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {pack.category}
                                </span>
                            </div>

                            {/* Title & Desc */}
                            <h4 className={`font-semibold mb-1 ${isActive ? 'text-amber-400' : 'text-white'}`}>
                                {pack.title}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {pack.description}
                            </p>

                            {/* Footer Info */}
                            <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {pack.duration_hours}h
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-amber-500/50" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    IMPACT: {pack.impact_score}/10
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
