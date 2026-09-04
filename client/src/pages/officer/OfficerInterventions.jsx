import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OfficerInterventions = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const { data } = await api.get('/officer/interventions');
        setSignals(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interventions');
      } finally {
        setLoading(false);
      }
    };
    fetchInterventions();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading intervention radar...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const filteredSignals = filter === 'ALL' ? signals : signals.filter(s => s.priority === filter);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>⚠️ Intervention Radar</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Actionable signals requiring Placement Officer attention.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button 
              key={p}
              onClick={() => setFilter(p)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: filter === p ? 'var(--color-surface)' : 'transparent',
                color: filter === p ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: filter === p ? 700 : 600,
                boxShadow: filter === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              {p === 'ALL' ? 'All Priority' : p}
            </button>
          ))}
        </div>
      </div>

      {filteredSignals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>All clear!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>No pending interventions for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredSignals.map((sig, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'var(--color-surface)', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)', 
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{sig.student.name}</h3>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', 
                    background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : sig.priority === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', 
                    color: sig.priority === 'HIGH' ? '#ef4444' : sig.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' 
                  }}>
                    {sig.priority} PRIORITY
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', 
                    background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' 
                  }}>
                    {sig.type.replace('_', ' ')}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  {sig.reason}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                  <span>🎓 Dept: {sig.student.department || 'N/A'}</span>
                  <span>👨‍🏫 Mentor: {sig.student.mentorId?.name || 'Unassigned'}</span>
                </div>
                {sig.action && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                    Recommended Action: {sig.action}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => navigate(`/officer/students/${sig.student._id}`)}
                style={{
                  background: 'var(--color-brand-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerInterventions;
