import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import './ChatPage.css';

export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Load conversation history on mount
    useEffect(() => {
        if (user) {
            loadConversationHistory();
        }
    }, [user]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadConversationHistory() {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('conversation_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);
        } catch (error) {
            console.error('Error loading conversation history:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSendMessage() {
        if (!input.trim() || isTyping) return;

        const userMessageText = input.trim();

        // 1. Add user message to UI immediately
        const userMessage = {
            role: 'user',
            message: userMessageText,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        // 2. Save user message to DB
        try {
            await supabase.from('conversation_history').insert({
                user_id: user.id,
                role: 'user',
                message: userMessageText
            });
        } catch (error) {
            console.error('Error saving user message:', error);
        }

        // 3. Clear input
        setInput('');
        setIsTyping(true);

        // 4. Call chat-api Edge Function
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-api`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    message: userMessageText
                })
            });

            if (!response.ok) {
                throw new Error('Chat API request failed');
            }

            const data = await response.json();

            // 5. Add bot response to UI
            if (data.success && data.response) {
                const botMessage = {
                    role: 'assistant',
                    message: data.response,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error calling chat-api:', error);
            // Add error message to UI
            const errorMessage = {
                role: 'assistant',
                message: '⚠️ Entschuldigung, es gab einen Fehler. Bitte versuche es nochmal.',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    if (!user) {
        return (
            <div className="chat-container">
                <div className="chat-error">
                    <p>Bitte melde dich an, um den Chat zu nutzen.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1>💬 Chat mit deinem Longevity Coach</h1>
                <p className="chat-subtitle">Stelle Fragen, berichte über deinen Schlaf, oder hole dir personalisierte Empfehlungen</p>
            </div>

            <div className="chat-messages">
                {isLoading ? (
                    <div className="chat-loading">
                        <p>Lade Konversation...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-welcome">
                        <h2>Willkommen! 👋</h2>
                        <p>Ich bin dein persönlicher Longevity Coach. Ich kann dir helfen mit:</p>
                        <ul>
                            <li>📊 Schlaf- und Recovery-Tracking</li>
                            <li>🏋️ Trainingsempfehlungen basierend auf deinem Zustand</li>
                            <li>🧠 Wissenschaftlich fundierte Longevity-Tipps</li>
                            <li>💡 Personalisierte Optimierungsvorschläge</li>
                        </ul>
                        <p><strong>Probiere es aus:</strong> "Ich habe letzte Nacht 6 Stunden geschlafen" oder "Soll ich heute trainieren?"</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`message message-${msg.role}`}>
                            <div className="message-content">
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                                ) : (
                                    <p>{msg.message}</p>
                                )}
                            </div>
                            <div className="message-timestamp">
                                {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    ))
                )}

                {isTyping && (
                    <div className="message message-assistant">
                        <div className="message-content">
                            <p className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nachricht eingeben... (Enter zum Senden, Shift+Enter für neue Zeile)"
                    rows={2}
                    disabled={isTyping}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="chat-send-button"
                >
                    {isTyping ? '...' : 'Senden'}
                </button>
            </div>
        </div>
    );
}
