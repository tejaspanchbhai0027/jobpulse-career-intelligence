import React, { useState } from 'react';
import api from '../../api/axios';

const AddRecommendationModal = ({ studentId, onClose, onSuccess }) => {
  const [type, setType] = useState('Resume Review');
  const [priority, setPriority] = useState('Normal');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const types = [
    'Resume Review',
    'Interview Preparation',
    'Application Strategy',
    'Skill Development',
    'Career Guidance',
    'Other'
  ];

  const priorities = ['Normal', 'Important', 'Urgent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/mentor/students/${studentId}/recommendations`, {
        type,
        priority,
        message
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 17, 21, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        width: '100%', maxWidth: '500px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Add Support Recommendation
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommendation Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%', padding: '0.8rem 1rem', background: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)',
                outline: 'none', fontSize: '0.95rem'
              }}
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                width: '100%', padding: '0.8rem 1rem', background: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)',
                outline: 'none', fontSize: '0.95rem'
              }}
            >
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Let's review your resume because your recent applications have received limited interview responses."
              rows="4"
              style={{
                width: '100%', padding: '0.8rem 1rem', background: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)',
                outline: 'none', fontSize: '0.95rem', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.8rem 1.5rem', background: 'transparent', color: 'var(--color-text-secondary)',
                border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              {loading ? 'Adding...' : 'Add Recommendation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecommendationModal;
