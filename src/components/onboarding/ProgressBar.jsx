import React from 'react';
import './ProgressBar.css';

/**
 * ProgressBar - Visual progress indicator for multi-step flows
 * 
 * Shows current step, total steps, and percentage completion.
 * Used in onboarding, intake forms, and multi-step wizards.
 * 
 * @param {number} currentStep - Current step (1-indexed)
 * @param {number} totalSteps - Total number of steps
 * @param {array} stepLabels - Optional labels for each step
 */
export default function ProgressBar({ currentStep, totalSteps, stepLabels = [] }) {
    const percentage = (currentStep / totalSteps) * 100;

    return (
        <div className="progress-bar-container">
            {/* Progress Bar */}
            <div className="progress-bar">
                <div
                    className="progress-bar__fill"
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                    aria-label={`Step ${currentStep} of ${totalSteps}`}
                />
            </div>

            {/* Step Indicator */}
            <div className="progress-bar__text">
                <span className="progress-bar__current">Step {currentStep}</span>
                <span className="progress-bar__separator"> of </span>
                <span className="progress-bar__total">{totalSteps}</span>
            </div>

            {/* Step Labels (if provided) */}
            {stepLabels.length > 0 && (
                <div className="progress-bar__steps">
                    {stepLabels.map((label, index) => (
                        <div
                            key={index}
                            className={`progress-bar__step ${index + 1 === currentStep ? 'active' : ''
                                } ${index + 1 < currentStep ? 'completed' : ''}`}
                        >
                            <div className="progress-bar__step-number">
                                {index + 1 < currentStep ? '✓' : index + 1}
                            </div>
                            <div className="progress-bar__step-label">{label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
