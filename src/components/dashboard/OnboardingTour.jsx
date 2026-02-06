import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

export default function OnboardingTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Check if tour has been seen
        const hasSeenTour = localStorage.getItem('has_seen_dashboard_tour');

        // Only run if not seen and we are on the dashboard (which this component is inside)
        if (!hasSeenTour) {
            // Small delay to ensure UI is rendered
            const timer = setTimeout(() => {
                setRun(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status, type } = data;

        // Once finished or skipped, remember it
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            localStorage.setItem('has_seen_dashboard_tour', 'true');
        }
    };

    const steps = [
        {
            target: 'body',
            content: (
                <div className="text-left">
                    <h3 className="font-bold text-lg mb-2 text-slate-900">Willkommen bei ExtensioVitae 👋</h3>
                    <p className="text-slate-600 text-sm">
                        Dies ist dein persönliches Operating System für Langlebigkeit. Lass uns kurz die wichtigsten Bereiche anschauen.
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="daily-progress"]',
            content: (
                <div className="text-left">
                    <h3 className="font-bold text-md mb-1 text-slate-900">Dein Tagesziel</h3>
                    <p className="text-slate-600 text-sm">
                        Verfolge hier deinen täglichen Fortschritt. Jeder abgehakte Task bringt dich deinem Longevity-Ziel näher.
                    </p>
                </div>
            ),
        },
        {
            target: '[data-tour="module-hub-trigger"]', // We need to add this class/data attr to the button
            content: (
                <div className="text-left">
                    <h3 className="font-bold text-md mb-1 text-slate-900">Die Protokoll-Bibliothek</h3>
                    <p className="text-slate-600 text-sm">
                        Hier findest du spezialisierte Module (Fasten, Schlaf, Stress), die du nach Bedarf aktivieren kannst.
                    </p>
                </div>
            ),
        }
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#F59E0B', // amber-500
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                    textColor: '#1e293b', // slate-800
                    overlayColor: 'rgba(15, 23, 42, 0.85)', // slate-900 with opacity
                    zIndex: 10000,
                },
                buttonNext: {
                    backgroundColor: '#F59E0B',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    borderRadius: '0.5rem',
                },
                buttonBack: {
                    color: '#64748b',
                }
            }}
            locale={{
                back: 'Zurück',
                close: 'Schließen',
                last: 'Starten 🚀',
                next: 'Weiter',
                skip: 'Überspringen',
            }}
        />
    );
}
