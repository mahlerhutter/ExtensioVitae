import React from 'react';
import { MODULE_DESCRIPTIONS } from '../../constants/moduleDescriptions';
import './ModuleCard.css';

/**
 * ModuleCard - Reusable component for module onboarding
 * 
 * Displays module information with icon, headline, description, and CTA.
 * Used in onboarding flows, module marketplace, and dashboard.
 * 
 * @param {string} moduleKey - Key from MODULE_DESCRIPTIONS
 * @param {function} onActivate - Callback when user activates module
 * @param {boolean} isActive - Whether module is currently active
 * @param {boolean} showScience - Whether to show science tooltip
 */
export default function ModuleCard({
    moduleKey,
    onActivate,
    isActive = false,
    showScience = true
}) {
    const module = MODULE_DESCRIPTIONS[moduleKey];

    if (!module) {
        console.error(`Module "${moduleKey}" not found in MODULE_DESCRIPTIONS`);
        return null;
    }

    const handleActivate = () => {
        if (onActivate && !isActive) {
            onActivate(moduleKey);
        }
    };

    return (
        <div className={`module-card ${isActive ? 'module-card--active' : ''}`}>
            {/* Icon Badge */}
            <div className="module-card__icon">
                {module.icon}
            </div>

            {/* Content */}
            <div className="module-card__content">
                <h3 className="module-card__headline">
                    {module.onboarding.headline}
                </h3>
                <p className="module-card__description">
                    {module.onboarding.description}
                </p>
            </div>

            {/* Actions */}
            <div className="module-card__actions">
                <button
                    onClick={handleActivate}
                    className={`module-card__cta ${isActive ? 'module-card__cta--active' : ''}`}
                    disabled={isActive}
                >
                    {isActive ? '✓ Aktiviert' : module.onboarding.cta}
                </button>

                {showScience && (
                    <button
                        className="module-card__info"
                        title={module.tooltip}
                        aria-label="Mehr Informationen"
                    >
                        ℹ️
                    </button>
                )}
            </div>

            {/* Category Badge */}
            <div className="module-card__badge">
                {module.category === 'intelligence_layer' ? '🧠 Intelligence' : '🚀 Strategic'}
            </div>
        </div>
    );
}
