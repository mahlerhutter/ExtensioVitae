import { ChatInterface } from './ChatInterface';
import './ChatModal.css';

export function ChatModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="chat-modal-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="chat-modal">
                <div className="chat-modal-content">
                    <ChatInterface onClose={onClose} />
                </div>
            </div>
        </>
    );
}
