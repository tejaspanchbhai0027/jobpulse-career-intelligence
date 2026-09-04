import React, { useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const OfficerIntelligence = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', data: { summary: "Hello Officer. I am your Placement Intelligence Copilot. Ask me questions like 'Which students need attention?' or 'How many applications?'" } }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e, text = query) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.post('/officer/intelligence/copilot', { message: text });
      setMessages(prev => [...prev, { role: 'system', data: response.data.data }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', data: { summary: 'I encountered an error connecting to the placement intelligence engine.', warnings: [error.response?.data?.message || 'Network error'] } }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.role === 'user') return <div>{msg.text}</div>;
    if (!msg.data) return <div>{msg.text || 'Processing error'}</div>;

    const { summary, keyMetrics, students, recommendations, warnings, timestamp } = msg.data;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {summary && <div style={{ fontSize: '1rem', lineHeight: 1.5 }}>{summary}</div>}
        
        {keyMetrics && keyMetrics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {keyMetrics.map((k, i) => (
              <div key={i} style={{ background: 'var(--color-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{k.value}</span>
              </div>
            ))}
          </div>
        )}

        {students && students.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {students.map((s, i) => (
              <div key={i} style={{ background: 'var(--color-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.name}</div>
                  {s.note && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{s.note}</div>}
                </div>
                {s._id && (
                  <Link to={`/officer/students/${s._id}`} style={{ color: 'var(--color-brand-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    View Profile &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div style={{ background: '#3F1A1A', padding: '1rem', borderRadius: '8px', border: '1px solid #7F1D1D' }}>
            <div style={{ color: '#FCA5A5', fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Warnings</div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#FCA5A5', fontSize: '0.9rem' }}>
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div style={{ background: 'var(--color-surface-overlay)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>💡 Recommendations</div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              {recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {timestamp && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Based on verified placement data • Updated: {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>🧠 Placement Intelligence Copilot</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Your AI assistant for placement strategy and insights.</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {["Which students need attention?", "How many applications this month?", "Mentors with most students"].map((suggestion, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(null, suggestion)}
              style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--color-brand-primary)' : 'var(--color-surface-overlay)',
              color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderBottomLeftRadius: msg.role === 'system' ? '4px' : '16px',
              maxWidth: '80%',
              border: msg.role === 'system' ? '1px solid var(--color-border)' : 'none',
              lineHeight: 1.5
            }}>
              {renderMessageContent(msg)}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '1rem 1.5rem', background: 'var(--color-surface-overlay)', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Analyzing verified placement data...</span>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask Copilot about placement trends, student risks, or mentor performance..."
              style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              style={{ background: 'var(--color-brand-primary)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: (loading || !query.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !query.trim()) ? 0.7 : 1 }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfficerIntelligence;
