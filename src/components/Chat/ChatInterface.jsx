import { useState, useEffect, useRef } from 'react';
import { sendMessage, getConversationHistory, subscribeToMessages } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import './ChatInterface.css';

export function ChatInterface({ onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Load conversation history on mount
    useEffect(() => {
        if (user?.id) {
            loadHistory();
        }
    }, [user?.id]);

    // Subscribe to new messages
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = subscribeToMessages(user.id, (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
        });

        return unsubscribe;
    }, [user?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const history = await getConversationHistory(user.id);
            setMessages(history);
        } catch (err) {
            console.error('Failed to load history:', err);
            setError('Konnte Gesprächsverlauf nicht laden');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !user?.id || loading) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            message: input,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const response = await sendMessage(user.id, input);

            const assistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                message: response.response,
                created_at: new Date().toISOString(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Nachricht konnte nicht gesendet werden');

            // Show error message in chat
            const errorMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                message: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte versuche es nochmal.',
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) {
        return (
            <div className="chat-interface">
                <div className="chat-error">
                    Bitte melde dich an, um den Chat zu nutzen.
                </div>
            </div>
        );
    }

    return (
        <div className="chat-interface">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-content">
                    <h3>💬 Longevity Coach</h3>
                    <p>Dein persönlicher Gesundheitsberater</p>
                </div>
                {onClose && (
                    <button className="chat-close" onClick={onClose} aria-label="Schließen">
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {loadingHistory ? (
                    <div className="chat-loading">
                        <div className="spinner"></div>
                        <p>Lade Gesprächsverlauf...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">👋</div>
                        <h4>Willkommen!</h4>
                        <p>Stelle mir eine Frage zu deiner Gesundheit oder berichte über deinen aktuellen Zustand.</p>
                        <div className="chat-suggestions">
                            <button onClick={() => setInput('Wie kann ich besser schlafen?')}>
                                Wie kann ich besser schlafen?
                            </button>
                            <button onClick={() => setInput('Soll ich heute trainieren?')}>
                                Soll ich heute trainieren?
                            </button>
                            <button onClick={() => setInput('Ich habe 6h geschlafen')}>
                                Ich habe 6h geschlafen
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chat-message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className="message-bubble">
                                    <div className="message-content">{msg.message}</div>
                                    <div className="message-time">{formatTime(msg.created_at)}</div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message assistant">
                                <div className="message-avatar">🤖</div>
                                <div className="message-bubble">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="chat-error-banner">
                    ⚠️ {error}
                </div>
            )}

            {/* Input */}
            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Schreibe eine Nachricht..."
                    disabled={loading}
                    rows={1}
                />
                <button
                    className="chat-send-button"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    aria-label="Senden"
                >
                    {loading ? '⏳' : '📤'}
                </button>
            </div>
        </div>
    );
}
