import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const MentorInterventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED
  const navigate = useNavigate();

  const fetchInterventions = async () => {
    try {
      const { data } = await api.get('/mentor/interventions');
      setInterventions(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/mentor/interventions/${id}`, { status: newStatus });
      fetchInterventions(); // refresh to get updated timestamps
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading intervention signals...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const filteredInterventions = filter === 'ALL' 
    ? interventions 
    : interventions.filter(i => i.status === filter);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Action Plan Queue</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Manage interventions and follow-ups for your assigned students.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(p => (
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
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredInterventions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', margin: '0 auto 1rem auto', width: '60px', height: '60px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>Queue is clear.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>No intervention records found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredInterventions.map((sig) => (
            <div 
              key={sig._id} 
              style={{ 
                background: 'var(--color-surface)', 
                borderRadius: '12px', 
                border: `1px solid ${sig.status === 'RESOLVED' ? '#10b981' : 'var(--color-border)'}`, 
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{sig.student?.name || 'Unknown Student'}</h3>
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
                    {sig.type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase',
                    color: sig.status === 'RESOLVED' ? '#10b981' : sig.status === 'OPEN' ? '#ef4444' : '#3b82f6'
                  }}>
                    {sig.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  <strong>Issue:</strong> {sig.reason}
                </p>
                {sig.dueDate && (
                  <div style={{ fontSize: '0.85rem', color: '#f43f5e', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Target Resolution: {new Date(sig.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Created: {new Date(sig.createdAt).toLocaleDateString()}
                  {sig.resolvedAt && ` • Resolved: ${new Date(sig.resolvedAt).toLocaleDateString()}`}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                <button 
                  onClick={() => navigate(`/mentor/students/${sig.student._id}`)}
                  style={{
                    background: 'var(--color-brand-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  View Profile
                </button>
                {sig.status === 'OPEN' && (
                  <button 
                    onClick={() => handleUpdateStatus(sig._id, 'IN_PROGRESS')}
                    style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark In Progress
                  </button>
                )}
                {sig.status === 'IN_PROGRESS' && (
                  <button 
                    onClick={() => handleUpdateStatus(sig._id, 'RESOLVED')}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Resolve Issue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorInterventions;
