# 🚀 Frontend Integration - Quick Start Guide

**Goal:** Integrate the RAG + Chat system into the ExtensioVitae dashboard

**Time Estimate:** 30-45 minutes

---

## 📋 **PREREQUISITES**

✅ Backend APIs deployed (canon-api, state-api, chat-api)  
✅ Supabase client configured in frontend  
✅ User authentication working  

---

## 🎯 **IMPLEMENTATION PLAN**

### **Step 1: Create Chat Component** (15 min)

**File:** `src/components/Chat/ChatInterface.tsx`

**Features:**
- Message input field
- Message history display
- Loading states
- Error handling
- Auto-scroll to latest message

### **Step 2: Create API Service** (10 min)

**File:** `src/services/chatService.ts`

**Functions:**
- `sendMessage(userId, message)` → Call chat-api
- `getConversationHistory(userId)` → Fetch from DB
- `getUserState(userId)` → Call state-api

### **Step 3: Integrate into Dashboard** (10 min)

**File:** `src/pages/Dashboard.tsx`

**Add:**
- Chat button/icon
- Chat modal/sidebar
- Notification badge (new messages)

### **Step 4: Add State Context** (10 min)

**File:** `src/contexts/UserStateContext.tsx`

**Provide:**
- Current user state
- Update functions
- Real-time sync

---

## 💻 **CODE TEMPLATES**

### **1. Chat Interface Component**

```typescript
// src/components/Chat/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { sendMessage, getConversationHistory } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const history = await getConversationHistory(user!.id);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user?.id) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      message: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(user.id, input);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        message: response.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error message
      const errorMessage: Message = {
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

  return (
    <div className="chat-interface">
      {/* Messages */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.message}</div>
            <div className="message-time">
              {new Date(msg.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Schreibe eine Nachricht..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sende...' : 'Senden'}
        </button>
      </div>
    </div>
  );
}
```

---

### **2. Chat Service**

```typescript
// src/services/chatService.ts
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function sendMessage(userId: string, message: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getConversationHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUserState(userId: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/state-api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'get_state', user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get user state');
  }

  return response.json();
}
```

---

### **3. Chat Styles**

```css
/* src/components/Chat/ChatInterface.css */
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  animation: fadeIn 0.3s ease-in;
}

.message.user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1f2937;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.input-container {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.input-container input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input-container input:focus {
  border-color: #3b82f6;
}

.input-container button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.input-container button:hover:not(:disabled) {
  background: #2563eb;
}

.input-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🎨 **DESIGN CONSIDERATIONS**

### **User Experience**

1. **Loading States**
   - Show typing indicator while waiting for response
   - Disable input during processing
   - Show skeleton loaders for history

2. **Error Handling**
   - Display friendly error messages
   - Retry button for failed messages
   - Offline detection

3. **Accessibility**
   - Keyboard navigation (Enter to send)
   - Screen reader support
   - Focus management

4. **Mobile Responsive**
   - Full-screen on mobile
   - Touch-friendly buttons
   - Swipe to close

### **Visual Enhancements**

1. **Message Formatting**
   - Markdown support (bold, lists, etc.)
   - Code syntax highlighting
   - Link detection

2. **Timestamps**
   - Relative time ("2 minutes ago")
   - Date separators ("Today", "Yesterday")

3. **User State Display**
   - Show current state in sidebar
   - Highlight changes
   - Visual indicators (sleep debt, stress level)

---

## 🧪 **TESTING CHECKLIST**

### **Functional Tests**

- [ ] Send message and receive response
- [ ] Load conversation history on mount
- [ ] Auto-scroll to latest message
- [ ] Handle errors gracefully
- [ ] Disable input while loading
- [ ] Enter key sends message

### **Integration Tests**

- [ ] User authentication works
- [ ] State updates reflect in UI
- [ ] Conversation persists across sessions
- [ ] Multiple users don't see each other's chats

### **UI/UX Tests**

- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] Timestamps accurate

---

## 🚀 **DEPLOYMENT**

### **Environment Variables**

Add to `.env`:
```bash
VITE_SUPABASE_URL=https://qnjjusilviwvovrlunep.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Build & Deploy**

```bash
npm run build
npm run preview  # Test production build
# Deploy to Vercel/Netlify/etc.
```

---

## 📊 **MONITORING**

### **Analytics to Track**

1. **Usage Metrics**
   - Messages per user
   - Average session length
   - Most common intents

2. **Performance Metrics**
   - Response latency
   - Error rate
   - API success rate

3. **User Satisfaction**
   - Feedback ratings
   - Conversation completion rate
   - Repeat usage

---

## 🎯 **NEXT FEATURES**

1. **Voice Input** (Speech-to-text)
2. **Suggested Prompts** (Quick actions)
3. **Canon Entry Citations** (Show sources)
4. **Export Conversation** (PDF, Markdown)
5. **Multi-language Support** (Full i18n)

---

**Ready to start?** Let's build the Chat UI! 🚀
