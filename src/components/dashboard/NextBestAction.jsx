import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NextBestAction.css';

/**
 * NextBestAction - Always shows the user what to do next
 * 
 * Priority logic:
 * 1. Morning check-in (if not done)
 * 2. Incomplete tasks
 * 3. Upload lab results (if none)
 * 4. Connect calendar (if not connected)
 * 5. All done!
 * 
 * @param {object} user - User object
 * @param {object} todayStats - Today's statistics
 */
export default function NextBestAction({ user, todayStats = {} }) {
    const navigate = useNavigate();
    const action = determineNextAction(user, todayStats);

    if (!action) return null;

    const handleClick = () => {
        if (action.link) {
            if (action.link.startsWith('#')) {
                // Scroll to element
                const element = document.querySelector(action.link);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Navigate to page
                navigate(action.link);
            }
        }
    };

    return (
        <div className="next-best-action">
            <h3 className="next-best-action__title">Nächster Schritt</h3>
            <button
                className="next-best-action__button"
                onClick={handleClick}
            >
                <span className="next-best-action__icon">{action.icon}</span>
                <div className="next-best-action__content">
                    <span className="next-best-action__text">{action.text}</span>
                    <span className="next-best-action__reason">{action.reason}</span>
                </div>
                <span className="next-best-action__arrow">→</span>
            </button>
        </div>
    );
}

function determineNextAction(user, todayStats) {
    // Priority 1: Morning check-in
    if (!todayStats.morningCheckIn) {
        return {
            icon: '☀️',
            text: 'Morning Check-in starten',
            reason: 'Starte deinen Tag richtig. Dauert 30 Sekunden.',
            link: '/health-profile'  // Navigate to health profile for recovery tracking
        };
    }

    // Priority 2: Incomplete tasks
    if (todayStats.incompleteTasks > 0) {
        return {
            icon: '✅',
            text: `${todayStats.incompleteTasks} Task${todayStats.incompleteTasks > 1 ? 's' : ''} erledigen`,
            reason: 'Du machst Fortschritte. Weiter so!',
            link: '/dashboard'  // Stay on dashboard where tasks are shown
        };
    }

    // Priority 3: Lab results
    if (!user?.hasLabResults) {
        return {
            icon: '🧪',
            text: 'Laborergebnisse hochladen',
            reason: 'Erhalte personalisierte Biomarker-Insights.',
            link: '/lab'
        };
    }

    // Priority 4: Calendar connection
    if (!user?.hasCalendarConnected) {
        return {
            icon: '📅',
            text: 'Kalender verbinden',
            reason: 'Automatische Jet-Lag- und Focus-Block-Erkennung.',
            link: '/settings/calendar'
        };
    }

    // Priority 5: All done!
    return {
        icon: '🎉',
        text: 'Alles erledigt für heute!',
        reason: 'Großartige Arbeit. Genieße deinen Tag!',
        link: '/dashboard'
    };
}
