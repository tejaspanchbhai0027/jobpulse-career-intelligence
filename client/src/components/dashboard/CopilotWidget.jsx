import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

const CopilotWidget = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I'm your JobPulse Copilot. I have analyzed your pipeline. Ask me anything about your job search strategy or applications." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/copilot', { message: userText });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error connecting to the Copilot engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '400px' }}>
      
      {/* Header */}
      <div style={{ padding: '1rem', background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '1.25rem' }}>🧠</div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>JobPulse Copilot</div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? 'var(--color-brand)' : 'var(--color-surface-raised)',
            color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            borderBottomRightRadius: msg.role === 'user' ? '0' : '12px',
            borderBottomLeftRadius: msg.role === 'assistant' ? '0' : '12px',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none'
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            <div className="typing-indicator">Copilot is thinking<span>.</span><span>.</span><span>.</span></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Ask JobPulse anything..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none' }}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            style={{ background: 'var(--color-brand)', color: '#fff', border: 'none', padding: '0 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: (loading || !query.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !query.trim()) ? 0.5 : 1 }}
          >
            Send
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .typing-indicator span { animation: blink 1.4s infinite both; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
      `}} />
    </div>
  );
};

export default CopilotWidget;
