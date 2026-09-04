import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MentorRecommendationsWidget = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await api.get('/dashboard/recommendations');
        setRecommendations(data.data || []);
      } catch (err) {
        setError('Failed to load mentor recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/dashboard/recommendations/${id}/status`, { status: newStatus });
      setRecommendations(recs => recs.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Mentor Recommendations</h3>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '1rem' }}>Loading...</div>
      </div>
    );
  }

  // Show only OPEN and ACKNOWLEDGED recommendations to keep dashboard clean
  const activeRecs = recommendations.filter(r => r.status !== 'COMPLETED' && r.status !== 'DISMISSED');

  if (error || activeRecs.length === 0) {
    return (
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Mentor Recommendations</h3>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 1rem', background: 'var(--color-surface-overlay)', borderRadius: '12px' }}>
          No active mentor recommendations yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Mentor Recommendations 
        <span style={{ background: 'var(--color-brand-primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>{activeRecs.length}</span>
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeRecs.map(rec => (
          <div key={rec._id} style={{ 
            background: 'var(--color-surface-overlay)', 
            border: `1px solid ${rec.priority === 'Urgent' ? 'rgba(239,68,68,0.3)' : rec.priority === 'Important' ? 'rgba(245,158,11,0.3)' : 'var(--color-border)'}`, 
            borderRadius: '12px', padding: '1.25rem',
            borderLeft: `4px solid ${rec.priority === 'Urgent' ? '#ef4444' : rec.priority === 'Important' ? '#f59e0b' : '#3b82f6'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {rec.type}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  From: {rec.mentorId?.name || 'Your Mentor'}
                </div>
              </div>
              <div style={{
                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                background: rec.status === 'ACKNOWLEDGED' ? 'rgba(59,130,246,0.1)' : 'var(--color-bg)',
                color: rec.status === 'ACKNOWLEDGED' ? '#3b82f6' : 'var(--color-text-secondary)'
              }}>
                {rec.status}
              </div>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              {rec.message}
            </p>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              {rec.status === 'OPEN' && (
                <button
                  onClick={() => handleStatusUpdate(rec._id, 'ACKNOWLEDGED')}
                  style={{
                    background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none',
                    padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Mark as Acknowledged
                </button>
              )}
              
              <button
                onClick={() => handleStatusUpdate(rec._id, 'COMPLETED')}
                style={{
                  background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)',
                  padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Mark Completed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorRecommendationsWidget;
