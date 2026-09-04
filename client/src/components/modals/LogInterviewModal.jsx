import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const LogInterviewModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
  
  // Manual State
  const [manualForm, setManualForm] = useState({
    question: '',
    topic: 'General',
    difficulty: 3,
    myAnswer: '',
    betterAnswer: ''
  });

  // AI State
  const [transcript, setTranscript] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const TOPICS = ['General', 'Technical', 'Behavioral', 'System Design', 'HR', 'Other'];

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };

  const modalStyle = {
    background: 'var(--color-surface)', width: '90%', maxWidth: '700px',
    maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column'
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem', background: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)'
  };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' };

  const handleManualSave = async () => {
    if (!manualForm.question) {
      setError('Question is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/interviews/questions/bank', manualForm, { withCredentials: true });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!transcript || transcript.length < 10) {
      setError('Please provide a longer transcript or notes to analyze.');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/intelligence/analyze-transcript', { transcript }, { withCredentials: true });
      if (res.data.success) {
        setParsedQuestions(res.data.data.questions || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze transcript');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISave = async () => {
    if (!parsedQuestions || parsedQuestions.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/interviews/questions/bank', parsedQuestions, { withCredentials: true });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Log Interview Question</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Mode Selector */}
        {!parsedQuestions && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <div 
              style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: 600, borderBottom: mode === 'ai' ? '2px solid var(--color-brand-primary)' : '2px solid transparent', color: mode === 'ai' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', background: mode === 'ai' ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              onClick={() => setMode('ai')}
            >
              ✨ AI Auto-Extract
            </div>
            <div 
              style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: 600, borderBottom: mode === 'manual' ? '2px solid var(--color-brand-primary)' : '2px solid transparent', color: mode === 'manual' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', background: mode === 'manual' ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              onClick={() => setMode('manual')}
            >
              ✍️ Manual Entry
            </div>
          </div>
        )}

        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {parsedQuestions ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Extracted Questions ({parsedQuestions.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {parsedQuestions.map((q, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)', fontSize: '0.9rem' }}>{q.topic}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Difficulty: {q.difficulty}/5</span>
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Q: {q.question}</p>
                    
                    {q.myAnswer && (
                      <div style={{ padding: '0.75rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '0.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Your Answer:</div>
                        <p style={{ fontSize: '0.9rem' }}>{q.myAnswer}</p>
                      </div>
                    )}
                    
                    {q.betterAnswer && (
                      <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.25rem' }}>Better Answer:</div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{q.betterAnswer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : mode === 'ai' ? (
            <div>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Paste your interview notes, transcripts, or memory dumps here. JobPulse AI will automatically extract the questions asked, evaluate your responses, and generate optimized "Better Answers" for your question bank.
              </p>
              <textarea 
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Interviewer asked me about how React context works. I said it was a global state manager..."
                style={{ ...inputStyle, minHeight: '250px', resize: 'vertical' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Question *</label>
                <input type="text" value={manualForm.question} onChange={e => setManualForm({...manualForm, question: e.target.value})} placeholder="What is the time complexity of QuickSort?" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Topic</label>
                  <select value={manualForm.topic} onChange={e => setManualForm({...manualForm, topic: e.target.value})} style={inputStyle}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Difficulty (1-5)</label>
                  <input type="number" min="1" max="5" value={manualForm.difficulty} onChange={e => setManualForm({...manualForm, difficulty: parseInt(e.target.value) || 3})} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Your Answer</label>
                <textarea value={manualForm.myAnswer} onChange={e => setManualForm({...manualForm, myAnswer: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Better Answer (Ideal)</label>
                <textarea value={manualForm.betterAnswer} onChange={e => setManualForm({...manualForm, betterAnswer: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {parsedQuestions ? (
            <button onClick={() => setParsedQuestions(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
          ) : <div></div>}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            
            {parsedQuestions ? (
              <button onClick={handleAISave} disabled={saving} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                {saving ? 'Saving...' : 'Save to Bank'}
              </button>
            ) : mode === 'ai' ? (
              <button onClick={handleAnalyzeTranscript} disabled={aiLoading || !transcript} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: transcript ? 1 : 0.5 }}>
                {aiLoading ? <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : '✨ Analyze'}
              </button>
            ) : (
              <button onClick={handleManualSave} disabled={saving || !manualForm.question} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, opacity: manualForm.question ? 1 : 0.5 }}>
                {saving ? 'Saving...' : 'Save Question'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogInterviewModal;
