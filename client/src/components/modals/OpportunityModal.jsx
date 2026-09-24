import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OpportunityModal = ({ opportunity, onClose, onTrack }) => {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!opportunity) return null;

  const handleTrack = async () => {
    setTracking(true);
    setError(null);
    try {
      const application = await onTrack(opportunity._id);
      // Close modal and navigate to the application board, or just show success
      // We will navigate to the board
      onClose();
      navigate('/applications');
    } catch (err) {
      setError(err.message || 'Failed to track opportunity');
      setTracking(false);
    }
  };

  const handleCreateTask = () => {
    // Navigate to tasks with prepopulated title (we can pass via state)
    onClose();
    navigate('/tasks', { state: { prefillTitle: `Apply for ${opportunity.title} at ${opportunity.company}` } });
  };

  // Close on outside click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleBackdropClick} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '18px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {opportunity.type}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{opportunity.title}</h2>
            <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{opportunity.company}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Location</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500, marginTop: '2px' }}>{opportunity.location} ({opportunity.workMode})</div>
            </div>
            {opportunity.salary && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Salary / Stipend</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500, marginTop: '2px' }}>{opportunity.salary}</div>
              </div>
            )}
            {opportunity.deadline && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Deadline</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500, marginTop: '2px' }}>{new Date(opportunity.deadline).toLocaleDateString()}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Source</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500, marginTop: '2px' }}>{opportunity.source}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Description</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {opportunity.description}
            </p>
          </div>

          {/* Skills */}
          {opportunity.skills && opportunity.skills.length > 0 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Required Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {opportunity.skills.map((skill, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
        </div>
        
        <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-surface-overlay)' }}>
          {opportunity.url && (
            <a href={opportunity.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
              External Link ↗
            </a>
          )}
          <button onClick={handleCreateTask} className="btn-secondary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
            Create Task
          </button>
          
          {opportunity.isTracked ? (
            <button disabled className="btn-secondary" style={{ opacity: 0.6, cursor: 'not-allowed', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
              ✓ Tracked in Pipeline
            </button>
          ) : (
            <button onClick={handleTrack} disabled={tracking} className="btn-primary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tracking ? 'Tracking...' : 'Track Opportunity'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityModal;
