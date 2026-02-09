import { useState } from 'react';
import './ChatButton.css';

export function ChatButton({ onClick, hasUnread = false }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            className={`chat-button ${hasUnread ? 'has-unread' : ''}`}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Chat öffnen"
        >
            <div className="chat-button-icon">
                💬
            </div>
            {hasUnread && <div className="chat-button-badge"></div>}
            {isHovered && (
                <div className="chat-button-tooltip">
                    Longevity Coach
                </div>
            )}
        </button>
    );
}
