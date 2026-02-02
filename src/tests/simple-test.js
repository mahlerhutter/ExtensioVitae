// Simple test runner without Vite dependencies
import { calculateLongevityScore } from '../lib/longevityScore.js';

console.log('🧪 Running Longevity Score Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
    }
}

function expect(value) {
    return {
        toBe(expected) {
            if (value !== expected) {
                throw new Error(`Expected ${expected} but got ${value}`);
            }
        },
        toBeGreaterThan(expected) {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (value >= expected) {
                throw new Error(`Expected ${value} to be less than ${expected}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in value)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
    };
}

// Run tests
test('calculates baseline score for optimal health', () => {
    const result = calculateLongevityScore({
        age: 30,
        sex: 'male',
        sleep_hours_bucket: '7-8',
        stress_1_10: 3,
        training_frequency: '4-5x',
        diet_pattern: ['whole_foods'],
    });

    expect(result).toHaveProperty('score');
    expect(result.score).toBeGreaterThan(70);
});

test('calculates lower score for poor health habits', () => {
    const result = calculateLongevityScore({
        age: 50,
        sex: 'female',
        sleep_hours_bucket: '<5',
        stress_1_10: 9,
        training_frequency: 'none',
        diet_pattern: ['processed_foods'],
    });

    expect(result.score).toBeLessThan(60);
});

test('handles missing optional fields', () => {
    const result = calculateLongevityScore({
        age: 30,
        sex: 'male',
    });

    expect(result).toHaveProperty('score');
    expect(result.score).toBeGreaterThan(0);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
