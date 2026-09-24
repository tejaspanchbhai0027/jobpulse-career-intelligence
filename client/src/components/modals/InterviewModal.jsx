import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InterviewForm } from './InterviewSection';
import api from '../../api/axios';
import Toast from '../ui/Toast';

const InterviewModal = ({ isOpen, onClose, interview, onSave }) => {
  const isEdit = !!interview;
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'preparation'
  const [prep, setPrep] = useState({ notes: '', checklist: [], questions: [], topics: [] });
  const [generating, setGenerating] = useState(false);
  const [savingPrep, setSavingPrep] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (interview && interview.preparation) {
      setPrep({
        notes: interview.preparation.notes || '',
        checklist: interview.preparation.checklist || [],
        questions: interview.preparation.questions || [],
        topics: interview.preparation.topics || []
      });
    }
  }, [interview]);

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };

  const savePrep = async (updatedPrep) => {
    setSavingPrep(true);
    try {
      await api.put(`/interviews/${interview._id}/preparation`, updatedPrep);
      setPrep(updatedPrep);
      addToast('Saved', 'Preparation data updated.', 'success');
      // Update parent's interview reference quietly if possible, or assume parent refetches
    } catch (err) {
      addToast('Error', 'Failed to save preparation data.', 'error');
    } finally {
      setSavingPrep(false);
    }
  };

  const handleGeneratePrep = async () => {
    if (!interview || !interview.application) {
      return addToast('Error', 'Missing application data. Cannot generate prep kit.', 'error');
    }
    setGenerating(true);
    try {
      const res = await api.post(`/interviews/${interview._id}/generate-prep`);
      if (res.data.success) {
        setPrep(res.data.data);
        addToast('Success', 'AI Preparation Kit generated!', 'success');
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to generate prep kit.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleChecklist = (index) => {
    const updated = [...prep.checklist];
    updated[index].completed = !updated[index].completed;
    const newPrep = { ...prep, checklist: updated };
    setPrep(newPrep);
    savePrep(newPrep);
  };

  const handleNotesChange = (e) => {
    setPrep(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleNotesBlur = () => {
    if (interview && prep.notes !== (interview.preparation?.notes || '')) {
      savePrep(prep);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-[600px] flex flex-col"
        style={{
          animation: 'slide-up 0.2s ease',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              {isEdit ? 'Interview Workspace' : 'Schedule Interview'}
            </h3>
            {isEdit && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '0.6rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'var(--transition)',
                    background: activeTab === 'details' ? 'var(--gradient-brand)' : 'transparent',
                    color: activeTab === 'details' ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  📋 Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preparation')}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, transition: 'var(--transition)',
                    background: activeTab === 'preparation' ? 'var(--gradient-brand)' : 'transparent',
                    color: activeTab === 'preparation' ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  🚀 Preparation
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '1rem', transition: 'var(--transition)', alignSelf: 'flex-start'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {activeTab === 'details' || !isEdit ? (
            <InterviewForm
              existing={interview}
              onSave={onSave}
              onCancel={onClose}
              saving={false}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Preparation Checklist</h4>
                <button 
                  onClick={handleGeneratePrep} 
                  disabled={generating}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(20, 255, 236, 0.1)', 
                    color: '#14FFEC', 
                    border: '1px solid rgba(20, 255, 236, 0.3)', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: generating ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {generating ? '✨ Generating...' : '✨ Generate AI Prep Kit'}
                </button>
              </div>

              {prep.checklist && prep.checklist.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {prep.checklist.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => toggleChecklist(idx)} 
                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: item.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No checklist items yet. Generate a prep kit to get started.</div>
              )}

              {prep.topics && prep.topics.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>Topics to Review</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {prep.topics.map((topic, i) => (
                      <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'rgba(6, 182, 212, 0.1)', color: '#67e8f9', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {prep.questions && prep.questions.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>Questions to Prepare</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {prep.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>Personal Notes</h4>
                <textarea 
                  value={prep.notes}
                  onChange={handleNotesChange}
                  onBlur={handleNotesBlur}
                  placeholder="Draft your introduction, list your questions for them..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

            </div>
          )}
        </div>
      </div>
      <Toast toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>,
    document.body
  );
};

export default InterviewModal;
