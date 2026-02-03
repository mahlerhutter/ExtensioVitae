// Quick LLM Test Script
// Run this in browser console to test if LLM is being called

import { generatePlan } from './src/lib/planGenerator.js';

const testIntake = {
    name: 'Test User',
    age: 35,
    sex: 'male',
    primary_goal: 'longevity',
    time_available: 30,
    stress_1_10: 5
};

console.log('🧪 Testing LLM integration...');

generatePlan(testIntake, { forceAlgorithm: false })
    .then(plan => {
        console.log('✅ Plan generated!');
        console.log('Generation method:', plan.generation_method);
        console.log('LLM provider:', plan.llm_provider);
        console.log('Plan has', plan.days?.length, 'days');
    })
    .catch(error => {
        console.error('❌ Error:', error);
    });
