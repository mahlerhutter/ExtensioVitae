import { describe, it, expect } from 'vitest';
import { calculateLongevityScore } from '../lib/longevityScore.js';

describe('Longevity Score Calculation', () => {
    describe('Baseline Score', () => {
        it('should calculate baseline score for optimal health profile', () => {
            const intakeData = {
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 3,
                training_frequency: '4-5x',
                diet_pattern: ['whole_foods', 'high_protein'],
            };

            const result = calculateLongevityScore(intakeData);

            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('breakdown');
            expect(result.score).toBeGreaterThan(70);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should calculate lower score for poor health habits', () => {
            const intakeData = {
                age: 50,
                sex: 'female',
                sleep_hours_bucket: '<5',
                stress_1_10: 9,
                training_frequency: 'none',
                diet_pattern: ['processed_foods'],
            };

            const result = calculateLongevityScore(intakeData);

            expect(result.score).toBeLessThan(60);
            expect(result.breakdown.sleep).toBeLessThan(0);
            expect(result.breakdown.stress).toBeLessThan(0);
        });
    });

    describe('Age Factor', () => {
        it('should apply age-based baseline correctly', () => {
            const young = calculateLongevityScore({
                age: 25,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            const older = calculateLongevityScore({
                age: 65,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            // Younger person should have higher baseline
            expect(young.breakdown.age_baseline).toBeGreaterThan(older.breakdown.age_baseline);
        });
    });

    describe('Sleep Impact', () => {
        it('should penalize insufficient sleep', () => {
            const poorSleep = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '<5',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            const goodSleep = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            expect(poorSleep.breakdown.sleep).toBeLessThan(goodSleep.breakdown.sleep);
            expect(poorSleep.score).toBeLessThan(goodSleep.score);
        });

        it('should reward optimal sleep (7-8 hours)', () => {
            const result = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            expect(result.breakdown.sleep).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Stress Impact', () => {
        it('should penalize high stress levels', () => {
            const highStress = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 10,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            const lowStress = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 2,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            expect(highStress.breakdown.stress).toBeLessThan(lowStress.breakdown.stress);
            expect(highStress.score).toBeLessThan(lowStress.score);
        });
    });

    describe('Training Impact', () => {
        it('should reward regular exercise', () => {
            const noExercise = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: 'none',
                diet_pattern: ['balanced'],
            });

            const regularExercise = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '4-5x',
                diet_pattern: ['balanced'],
            });

            expect(regularExercise.breakdown.training).toBeGreaterThan(noExercise.breakdown.training);
            expect(regularExercise.score).toBeGreaterThan(noExercise.score);
        });
    });

    describe('Diet Impact', () => {
        it('should reward healthy diet patterns', () => {
            const unhealthyDiet = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['processed_foods'],
            });

            const healthyDiet = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['whole_foods', 'high_protein', 'mediterranean'],
            });

            expect(healthyDiet.breakdown.diet).toBeGreaterThan(unhealthyDiet.breakdown.diet);
            expect(healthyDiet.score).toBeGreaterThan(unhealthyDiet.score);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing optional fields', () => {
            const minimalData = {
                age: 30,
                sex: 'male',
            };

            const result = calculateLongevityScore(minimalData);

            expect(result).toHaveProperty('score');
            expect(result.score).toBeGreaterThan(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should clamp score between 0 and 100', () => {
            const extremelyPoor = {
                age: 80,
                sex: 'male',
                sleep_hours_bucket: '<5',
                stress_1_10: 10,
                training_frequency: 'none',
                diet_pattern: ['processed_foods'],
            };

            const result = calculateLongevityScore(extremelyPoor);

            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should handle invalid age gracefully', () => {
            const invalidAge = {
                age: -5,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            };

            const result = calculateLongevityScore(invalidAge);

            expect(result).toHaveProperty('score');
            expect(result.score).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Breakdown Structure', () => {
        it('should return all breakdown components', () => {
            const result = calculateLongevityScore({
                age: 30,
                sex: 'male',
                sleep_hours_bucket: '7-8',
                stress_1_10: 5,
                training_frequency: '2-3x',
                diet_pattern: ['balanced'],
            });

            expect(result.breakdown).toHaveProperty('age_baseline');
            expect(result.breakdown).toHaveProperty('sleep');
            expect(result.breakdown).toHaveProperty('stress');
            expect(result.breakdown).toHaveProperty('training');
            expect(result.breakdown).toHaveProperty('diet');
        });
    });
});
