import React, { useRef } from 'react';

/**
 * ShareScoreCard Component
 * Generates a shareable image of the user's longevity score
 */
export default function ShareScoreCard({ score, userName, onShare }) {
    const cardRef = useRef(null);

    const handleShare = async () => {
        if (!cardRef.current) return;

        try {
            // Use html2canvas-like approach with canvas API
            const card = cardRef.current;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size (1080x1080 for Instagram)
            canvas.width = 1080;
            canvas.height = 1080;

            // Background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1080, 1080);

            // Score circle
            const centerX = 540;
            const centerY = 440;
            const radius = 200;

            // Outer circle
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Score arc
            const scoreColor = score < 50 ? '#ef4444' : score <= 75 ? '#fbbf24' : '#10b981';
            ctx.strokeStyle = scoreColor;
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * score / 100));
            ctx.stroke();

            // Score text
            ctx.fillStyle = scoreColor;
            ctx.font = 'bold 140px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(score.toString(), centerX, centerY);

            // Label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText('BIOLOGICAL BASELINE', centerX, centerY + 280);

            // User name (if provided)
            if (userName) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(userName, centerX, 180);
            }

            // Logo/Branding
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText('Extensio', centerX - 50, 900);
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('Vitae', centerX + 70, 900);

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    console.error('Failed to create image blob');
                    return;
                }

                // Check if Web Share API is available (mobile)
                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], 'longevity-score.png', { type: 'image/png' });

                    if (navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'My Longevity Score',
                                text: `I scored ${score}/100 on my biological baseline! 🎯`
                            });
                            if (onShare) onShare();
                            return;
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.error('Share failed:', err);
                            }
                        }
                    }
                }

                // Fallback: Download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'longevity-score.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                if (onShare) onShare();
            }, 'image/png');

        } catch (error) {
            console.error('Error generating share image:', error);
        }
    };

    return (
        <>
            {/* Hidden template for reference (not used for rendering) */}
            <div ref={cardRef} className="hidden" />

            {/* Share button */}
            <button
                onClick={handleShare}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Score
            </button>
        </>
    );
}
