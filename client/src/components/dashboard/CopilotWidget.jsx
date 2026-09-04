import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

const CopilotWidget = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I'm your JobPulse Copilot. I have analyzed your pipeline. Ask me anything about your job search strategy or applications." }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "🎯 What should I do today?",
    "📈 Analyze my job search",
    "⚡ What needs follow-up?",
    "🧠 What's my biggest bottleneck?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, errorState]);

  const handleSend = async (textOverride) => {
    const userText = (typeof textOverride === 'string' ? textOverride : query).trim();
    if (!userText) return;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setLoading(true);
    setErrorState(false);

    try {
      const res = await api.post('/ai/copilot', { message: userText });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.data.reply }]);
      }
    } catch (err) {
      console.error('Copilot API Error:', err);
      setErrorState(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', text: "I'm your JobPulse Copilot. I have analyzed your pipeline. Ask me anything about your job search strategy or applications." }]);
    setErrorState(false);
  };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '500px', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦</div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>JobPulse Copilot</div>
        </div>
        <button onClick={handleClear} aria-label="Clear chat" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'var(--transition)' }} onMouseOver={(e) => e.target.style.color='var(--color-text-primary)'} onMouseOut={(e) => e.target.style.color='var(--color-text-secondary)'}>
          Reset
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? 'var(--gradient-brand)' : 'var(--color-surface-overlay)',
            color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
            boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
            whiteSpace: 'pre-wrap'
          }}>
            {msg.role === 'user' ? msg.text : <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
          </div>
        ))}
        
        {/* Suggested Prompts */}
        {messages.length === 1 && !loading && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {suggestedPrompts.map((prompt, i) => (
              <button key={i} onClick={() => handleSend(prompt)} style={{ background: 'transparent', border: '1px solid var(--color-brand-primary)', borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'var(--transition)' }} onMouseOver={(e) => { e.target.style.background = 'var(--color-brand-primary)'; e.target.style.color = '#fff'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-brand-primary)'; }}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1.25rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '16px', borderBottomLeftRadius: '4px', color: 'var(--color-text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Copilot is analyzing...
          </div>
        )}

        {errorState && (
          <div style={{ alignSelf: 'flex-start', padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', borderBottomLeftRadius: '4px', color: 'var(--color-danger)', fontSize: '0.95rem', maxWidth: '85%' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Connection Interrupted</div>
            <div style={{ opacity: 0.9, marginBottom: '0.75rem' }}>JobPulse Copilot couldn't complete that request right now.</div>
            <button onClick={() => handleSend(messages[messages.length-1].text)} style={{ background: 'var(--color-danger)', border: 'none', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              Try Again
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 m-4 mt-0 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-2 flex gap-2 items-end shadow-lg backdrop-blur-md">
        <textarea 
          placeholder="Ask Copilot anything..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
          style={{ flex: 1, padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '0.95rem', maxHeight: '100px', overflowY: 'auto' }}
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          style={{ background: 'var(--gradient-brand)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (loading || !query.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !query.trim()) ? 0.5 : 1, transition: 'var(--transition)', flexShrink: 0, marginBottom: '2px', marginRight: '2px' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default CopilotWidget;
