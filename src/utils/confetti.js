/**
 * Lightweight confetti effect without external dependencies
 * Creates DOM elements that animate and self-destruct
 */
export function fireConfetti() {
    const count = 50;
    const defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        const particleCount = Math.floor(count * particleRatio);

        for (let i = 0; i < particleCount; i++) {
            createConfettiPiece({
                ...defaults,
                ...opts,
                angle: opts.angle + (Math.random() - 0.5) * opts.spread,
            });
        }
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
        angle: 60,
    });

    fire(0.2, {
        spread: 60,
        angle: 120,
    });

    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        angle: 90,
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        angle: 90,
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 45,
        angle: 90,
    });
}

function createConfettiPiece(opts) {
    const confetti = document.createElement('div');
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = '50%';
    confetti.style.top = '70%';
    confetti.style.zIndex = '9999';
    confetti.style.pointerEvents = 'none';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

    document.body.appendChild(confetti);

    // Physics
    const angle = (opts.angle || 90) * (Math.PI / 180);
    const velocity = opts.startVelocity || 45;
    const spread = (opts.spread || 45) * (Math.PI / 180);
    const randomAngle = angle + (Math.random() - 0.5) * spread;

    let x = 0;
    let y = 0;
    let vx = Math.cos(randomAngle) * velocity;
    let vy = -Math.sin(randomAngle) * velocity;
    const gravity = 2;
    const decay = opts.decay || 0.9;

    let opacity = 1;

    function animate() {
        x += vx;
        y += vy;
        vy += gravity;
        vx *= decay;
        vy *= decay;
        opacity -= 0.01;

        confetti.style.transform = `translate(${x}px, ${y}px) rotate(${x * 2}deg)`;
        confetti.style.opacity = opacity;

        if (opacity > 0 && y < window.innerHeight) {
            requestAnimationFrame(animate);
        } else {
            confetti.remove();
        }
    }

    requestAnimationFrame(animate);
}
