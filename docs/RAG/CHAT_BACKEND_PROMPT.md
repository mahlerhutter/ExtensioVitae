# 🤖 Chat-Backend Implementation Prompt

**Context:** ExtensioVitae Chat-First Pivot  
**Goal:** Build chat interface + RAG-powered backend for testing  
**Timeline:** Week 1 (Chat UI) + Week 2 (chat-api)  
**User:** Logged-in users only (for testing)

---

## 📋 IMPLEMENTATION REQUEST

Build a **chat interface** at `/chat` route with a **chat-api Edge Function** that integrates with the existing RAG backend (user_states, canon_entries, semantic search).

---

## 🎯 REQUIREMENTS

### **1. Chat UI Component** (`/chat` route)

**Location:** `src/pages/ChatPage.jsx`

**Features:**
- Clean, minimal chat interface (similar to ChatGPT)
- Conversation history (scrollable, auto-scroll to bottom)
- Message input (textarea + send button)
- User messages (right-aligned, blue background)
- Bot messages (left-aligned, gray background)
- Markdown rendering for bot responses (use `react-markdown`)
- Typing indicator when bot is responding
- Timestamps for each message
- Loading state while fetching history

**UI Design:**
```
┌─────────────────────────────────────────────────────┐
│  💬 Chat mit deinem Longevity Coach                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Bot: Hallo! Wie kann ich dir heute helfen?        │
│  (09:00)                                            │
│                                                      │
│                      User: Ich habe 6h geschlafen   │
│                                                (09:01)│
│                                                      │
│  Bot: Verstanden. Dein Schlafdefizit ist jetzt     │
│  'moderate'. Basierend darauf empfehle ich heute    │
│  Zone 2 statt HIIT.                                 │
│  (09:01)                                            │
│                                                      │
│  [Bot is typing...]                                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│  [Nachricht eingeben...]              [Senden]     │
└─────────────────────────────────────────────────────┘
```

**Tech Stack:**
- React (existing setup)
- Supabase client (for fetching conversation history)
- `react-markdown` for rendering bot responses
- CSS for styling (use existing design system)

**Database:**
```sql
-- Already exists (create if not)
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  intent TEXT,
  state_updates JSONB DEFAULT '{}'::jsonb,
  canon_entries_used UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id 
  ON conversation_history(user_id, created_at DESC);
```

**Component Structure:**
```jsx
// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversationHistory() {
    // Fetch from conversation_history table
    // Order by created_at ASC
    // Set messages state
  }

  async function handleSendMessage() {
    if (!input.trim()) return;

    // 1. Add user message to UI immediately
    const userMessage = {
      role: 'user',
      message: input,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // 2. Save user message to DB
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      role: 'user',
      message: input
    });

    // 3. Clear input
    setInput('');
    setIsTyping(true);

    // 4. Call chat-api Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-api`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        message: input
      })
    });

    const data = await response.json();

    // 5. Add bot response to UI
    const botMessage = {
      role: 'assistant',
      message: data.response,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>💬 Chat mit deinem Longevity Coach</h1>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
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
        ))}

        {isTyping && (
          <div className="message message-assistant">
            <div className="message-content">
              <p className="typing-indicator">Bot is typing...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Nachricht eingeben..."
          rows={2}
        />
        <button onClick={handleSendMessage} disabled={!input.trim() || isTyping}>
          Senden
        </button>
      </div>
    </div>
  );
}
```

**CSS Styling:**
```css
/* src/pages/ChatPage.css */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f9fafb;
}

.message {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.message-user {
  align-items: flex-end;
}

.message-assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}

.message-user .message-content {
  background: #3b82f6;
  color: white;
}

.message-assistant .message-content {
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.message-timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.typing-indicator {
  font-style: italic;
  color: #6b7280;
}

.chat-input {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  display: flex;
  gap: 0.5rem;
}

.chat-input textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  resize: none;
  font-family: inherit;
}

.chat-input button {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.chat-input button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
```

---

### **2. chat-api Edge Function**

**Location:** `supabase/functions/chat-api/index.ts`

**Features:**
- Receive user message
- Classify intent (LLM)
- Parse state updates (if applicable)
- Retrieve relevant canon entries (RAG)
- Generate response (LLM)
- Save conversation to DB
- Return response

**Architecture:**
```
User Message
    ↓
Intent Classification (Claude 3.5 Sonnet)
    ├─ state_update: "Ich habe 6h geschlafen"
    ├─ question: "Soll ich heute trainieren?"
    ├─ feedback: "Das hat mir geholfen"
    └─ command: "/stats", "/history"
    ↓
Action Router
    ├─ state_update → parseStateUpdate() → state-api
    ├─ question → retrieveCanonEntries() → canon-api
    ├─ feedback → saveFeedback()
    └─ command → executeCommand()
    ↓
Response Generation (Claude 3.5 Sonnet)
    ├─ Conversation history (last 5 messages)
    ├─ Relevant canon entries
    ├─ Current user state
    └─ Generate empathetic, actionable response
    ↓
Save to conversation_history
    ↓
Return response
```

**Implementation:**
```typescript
// supabase/functions/chat-api/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  user_id: string;
  message: string;
}

interface Intent {
  type: 'state_update' | 'question' | 'feedback' | 'command';
  confidence: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, message }: ChatRequest = await req.json();

    if (!user_id || !message) {
      throw new Error('user_id and message are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get conversation history (last 5 messages)
    const { data: history } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const conversationHistory = history?.reverse() || [];

    // 2. Classify intent
    const intent = await classifyIntent(message, anthropicKey);

    // 3. Route based on intent
    let responseContext: any = {};

    if (intent.type === 'state_update') {
      // Parse state update
      const stateUpdate = await parseStateUpdate(message, anthropicKey);

      // Update user_states via state-api
      await fetch(`${supabaseUrl}/functions/v1/state-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_field',
          user_id: user_id,
          field: stateUpdate.field,
          new_value: stateUpdate.value,
          source: 'chat',
          context: { message }
        })
      });

      responseContext.stateUpdate = stateUpdate;
    }

    if (intent.type === 'question' || intent.type === 'state_update') {
      // Get current user state
      const { data: userState } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', user_id)
        .single();

      // Retrieve relevant canon entries via canon-api
      const canonResponse = await fetch(`${supabaseUrl}/functions/v1/canon-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'semantic_search',
          query: message,
          top_k: 3
        })
      });

      const canonData = await canonResponse.json();
      responseContext.canonEntries = canonData.data || [];
      responseContext.userState = userState;
    }

    // 4. Generate response
    const response = await generateResponse(
      message,
      conversationHistory,
      responseContext,
      anthropicKey
    );

    // 5. Save bot response to DB
    await supabase.from('conversation_history').insert({
      user_id: user_id,
      role: 'assistant',
      message: response,
      intent: intent.type,
      state_updates: responseContext.stateUpdate || {},
      canon_entries_used: responseContext.canonEntries?.map((e: any) => e.id) || []
    });

    return new Response(
      JSON.stringify({ success: true, response }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function classifyIntent(message: string, anthropicKey: string): Promise<Intent> {
  const prompt = `Classify the following user message into one of these intents:
- state_update: User is reporting a state change (e.g., "I slept 6 hours", "Stress level 8/10")
- question: User is asking a question (e.g., "Should I train today?", "What should I eat?")
- feedback: User is giving feedback (e.g., "That helped", "This didn't work")
- command: User is issuing a command (e.g., "/stats", "/history")

User message: "${message}"

Respond with JSON only: {"type": "state_update|question|feedback|command", "confidence": 0.0-1.0}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  const data = await response.json();
  const content = data.content[0].text;
  return JSON.parse(content);
}

async function parseStateUpdate(message: string, anthropicKey: string): Promise<any> {
  const prompt = `Extract state updates from the following user message.
Map to these fields:
- sleep_hours: number (e.g., "6h geschlafen" → 6)
- stress_1_10: number 1-10 (e.g., "Stress 8/10" → 8)
- training_frequency: string (e.g., "3x trainiert" → "3-4")

User message: "${message}"

Respond with JSON only: {"field": "sleep_hours|stress_1_10|training_frequency", "value": <value>}
If no state update found, respond with: {"field": null, "value": null}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  const data = await response.json();
  const content = data.content[0].text;
  return JSON.parse(content);
}

async function generateResponse(
  userMessage: string,
  conversationHistory: any[],
  context: any,
  anthropicKey: string
): Promise<string> {
  // Build context for LLM
  let systemPrompt = `Du bist ein empathischer Longevity Coach. Deine Aufgabe ist es, dem User zu helfen, seine Gesundheit und Langlebigkeit zu optimieren.

Kontext:
- User State: ${JSON.stringify(context.userState || {})}
- Relevante Canon Entries: ${JSON.stringify(context.canonEntries || [])}
- State Update: ${JSON.stringify(context.stateUpdate || {})}

Antwort-Richtlinien:
1. Sei empathisch und ermutigend
2. Gib konkrete, umsetzbare Empfehlungen
3. Beziehe dich auf wissenschaftliche Evidenz (Canon Entries)
4. Halte Antworten kurz und prägnant (max 3-4 Sätze)
5. Verwende Markdown für Formatierung (z.B. **bold**, - Listen)

Beispiel:
User: "Ich habe nur 6h geschlafen"
Bot: "Verstanden. Dein Schlafdefizit ist jetzt **moderate**. Basierend darauf empfehle ich heute:
- Zone 2 Cardio statt HIIT
- Früh ins Bett (vor 22:00)
- Magnesium vor dem Schlafen

Möchtest du mehr Details?"`;

  // Build conversation history
  const messages = [
    ...conversationHistory.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.message
    })),
    {
      role: 'user',
      content: userMessage
    }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    })
  });

  const data = await response.json();
  return data.content[0].text;
}
```

---

### **3. Integration Steps**

1. **Create conversation_history table** (run SQL in Supabase SQL Editor)
2. **Create ChatPage.jsx** component
3. **Add /chat route** to router
4. **Add chat link** to Dashboard Header
5. **Create chat-api Edge Function**
6. **Deploy chat-api** to Supabase
7. **Test end-to-end**

---

### **4. Testing Checklist**

- [ ] Can access /chat route when logged in
- [ ] Can send messages
- [ ] Messages appear in conversation history
- [ ] Bot responds within 3 seconds
- [ ] State updates work ("Ich habe 6h geschlafen")
- [ ] Questions work ("Soll ich heute trainieren?")
- [ ] Markdown rendering works
- [ ] Auto-scroll works
- [ ] Typing indicator works

---

### **5. Environment Variables**

Make sure these are set in Supabase Edge Functions:
- `ANTHROPIC_API_KEY` (Claude 3.5 Sonnet)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎯 SUCCESS CRITERIA

**Week 1 (Chat UI):**
- ✅ /chat route accessible
- ✅ Can send/receive messages
- ✅ Conversation history works
- ✅ Clean, minimal UI

**Week 2 (chat-api):**
- ✅ Intent classification 90% accurate
- ✅ State updates work
- ✅ RAG retrieval returns relevant canon entries
- ✅ Response time < 3 seconds
- ✅ Responses are empathetic and actionable

---

## 📚 REFERENCE

**Existing RAG Backend:**
- `user_states` table (sleep_debt, stress_load, recovery_state, training_load)
- `canon_entries` table (33 longevity principles)
- `state-api` Edge Function (user state management)
- `canon-api` Edge Function (semantic search)

**Documentation:**
- `docs/VISION.md` - Chat-First Vision
- `docs/FUTURE.md` - Chat-First Roadmap
- `docs/tasks.md` - Implementation Plan
- `docs/RAG_BACKEND_IMPLEMENTATION_PLAN.md` - RAG Architecture

---

**Ready to build! 🚀**
