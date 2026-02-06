import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

export default function OnboardingTour({ canStart = true }) {
    const [run, setRun] = useState(false);

    useEffect(() => {
        if (!canStart) return;

        // Check URL params for debug override
        const params = new URLSearchParams(window.location.search);
        const forceReset = params.get('tour') === 'reset';

        if (forceReset) {
            localStorage.removeItem('has_seen_dashboard_tour');
        }

        const hasSeenTour = localStorage.getItem('has_seen_dashboard_tour');

        if (!hasSeenTour || forceReset) {
            // WaitForElement logic
            console.log('[Onboarding] Waiting for elements...');
            const checkExist = setInterval(() => {
                const dashboardElement = document.querySelector('[data-tour="daily-progress"]');
                const moduleHubElement = document.querySelector('[data-tour="module-hub-trigger"]');

                console.log('[Onboarding] Checking elements:', { dashboard: !!dashboardElement, hub: !!moduleHubElement });

                if (dashboardElement && moduleHubElement) {
                    console.log('[Onboarding] Elements found! Starting tour.');
                    clearInterval(checkExist);
                    setRun(true);
                }
            }, 500); // Check every 500ms

            // Stop checking after 3s and force start (Joyride handles missing targets)
            const timer = setTimeout(() => {
                console.warn('[Onboarding] Elements not found in time. Forcing start.');
                clearInterval(checkExist);
                setRun(true);
            }, 3000);
            return () => { clearInterval(checkExist); clearTimeout(timer); };
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
                    <h3 className="font-bold text-md mb-1 text-slate-900">Module Hub</h3>
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
            disableOverlayClose={true}
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
