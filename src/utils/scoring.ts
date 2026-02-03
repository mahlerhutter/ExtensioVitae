
export function calculateLongevityScore(intakeData: any): number {
    if (!intakeData) return 50;

    let score = 50; // Baseline

    // 1. Sleep: <6h (-10), 6-7h (+0), >7h (+10)
    // Intake values: '<6', '6-6.5', '6.5-7', '7-7.5', '7.5-8', '>8'
    const sleep = intakeData.sleep_hours_bucket;
    if (sleep === '<6') {
        score -= 10;
    } else if (sleep === '7-7.5' || sleep === '7.5-8' || sleep === '>8') {
        score += 10;
    }
    // '6-6.5' and '6.5-7' result in +0

    // 2. Exercise: <2x/week (-5), >4x/week (+10)
    // Intake values: '0', '1-2', '3-4', '5+'
    const training = intakeData.training_frequency;
    if (training === '0' || training === '1-2') {
        score -= 5;
    } else if (training === '5+') {
        score += 10;
    }
    // '3-4' results in +0

    // 3. Stress: High (-10), Low (+10)
    // Intake value: 1-10 integer
    const stress = Number(intakeData.stress_1_10);
    if (stress >= 8) {
        score -= 10; // High stress
    } else if (stress <= 3) {
        score += 10; // Low stress
    }

    // Clamp between 0 and 100
    return Math.min(Math.max(score, 0), 100);
}

export function getScoreColor(score: number): string {
    if (score < 50) return 'text-red-500';
    if (score <= 75) return 'text-amber-400';
    return 'text-emerald-500';
}
