import React from 'react';

/**
 * Beta Version Badge
 * Displays version info on all pages to indicate beta status
 * 
 * Version History:
 * - v0.1 (2026-02-03): Initial MVP launch
 * - v0.2 (2026-02-04): Emergency Mode + Calendar API + Dashboard UX
 */
export default function BetaBadge() {
    return (
        <div className="fixed top-4 left-4 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase">
                    v0.6.4
                </span>
            </div>
        </div>
    );
}
