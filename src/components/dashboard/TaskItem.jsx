import React from 'react';
import { fireConfetti } from '../../utils/confetti';
import { useToast } from '../Toast';
import EvidenceText from './EvidenceText';

// Pillar configuration
const PILLARS = {
    sleep: { label: 'Sleep', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    movement: { label: 'Movement', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    nutrition: { label: 'Nutrition', color: 'bg-orange-500', textColor: 'text-orange-400' },
    stress: { label: 'Stress', color: 'bg-rose-500', textColor: 'text-rose-400' },
    connection: { label: 'Connection', color: 'bg-blue-500', textColor: 'text-blue-400' },
    mental: { label: 'Mental', color: 'bg-purple-500', textColor: 'text-purple-400' },
    supplements: { label: 'Supplements', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
};

/**
 * Task Item Component
 * Individual task with checkbox, pillar indicator, and time estimate
 */
export default function TaskItem({ task, completed, onToggle }) {
    const pillar = PILLARS[task.pillar] || { label: task.pillar || 'Task', color: 'bg-slate-500', textColor: 'text-slate-400' };
    const { addToast } = useToast();

    const handleToggle = () => {
        // Fire confetti if this is the Quick Win task and it's being completed
        if (task.id === 'quick-win-01' && !completed) {
            fireConfetti();
            addToast('🎉 Momentum started!', 'success');
        }
        onToggle();
    };

    const isQuickWin = task.is_quick_win || task.id === 'quick-win-01';

    return (
        <div
            className={`relative flex items-start gap-4 p-4 rounded-lg transition-all cursor-pointer ${isQuickWin ? 'border-2 border-amber-400/50 bg-amber-400/5' : ''
                } ${completed ? 'bg-slate-800/30' : 'bg-slate-800/60 hover:bg-slate-800'}`}
            onClick={handleToggle}
        >
            {isQuickWin && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Start Here
                </div>
            )}
            <button
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${completed
                    ? 'bg-amber-400 border-amber-400'
                    : 'border-slate-600 hover:border-amber-400'
                    }`}
            >
                {completed && (
                    <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${pillar.color}`} />
                    <span className={`text-xs font-medium ${pillar.textColor}`}>{pillar.label}</span>
                </div>
                <p className={`text-sm leading-relaxed ${completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    <EvidenceText text={task.task} />
                </p>
            </div>
            <span className="text-slate-500 text-sm whitespace-nowrap">{task.time_minutes} min</span>
        </div>
    );
}
