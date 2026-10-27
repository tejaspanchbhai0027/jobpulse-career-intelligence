import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';
import { Link } from 'react-router-dom';

const OfficerOffers = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/officer/placement-verification');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch verification alerts');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'High': return <span style={{ fontSize: '1.5rem' }}>🔴</span>;
      case 'Medium': return <span style={{ fontSize: '1.5rem' }}>🟠</span>;
      default: return <span style={{ fontSize: '1.5rem' }}>🔵</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'High': return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>HIGH</span>;
      case 'Medium': return <span style={{ background: '#ffedd5', color: '#c2410c', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>MEDIUM</span>;
      default: return <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>LOW</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton height="60px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="150px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="150px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Offer Verifications</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>Review incomplete or inconsistent placement records to ensure accurate reporting.</p>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: alerts.length > 0 ? '#ef4444' : '#10b981', lineHeight: 1 }}>
            {alerts.length}
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Action Items
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>All Clear!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>All offers and placement records are properly verified.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ 
              background: 'var(--color-surface)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '16px', 
              padding: '1.5rem',
              display: 'flex',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              alignItems: 'flex-start'
            }}>
              <div style={{ marginTop: '4px' }}>
                {getSeverityIcon(alert.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{alert.category}</h3>
                    {getSeverityBadge(alert.severity)}
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Record: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{alert.affectedRecord}</span>
                </div>
                
                <div style={{ background: 'var(--color-bg)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem', marginTop: 0 }}>{alert.explanation}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-primary)', fontWeight: 700, margin: 0 }}>Action Required: {alert.action}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to={`/officer/placement-drives`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'rgba(37,99,235,0.05)', borderRadius: '8px', transition: 'var(--transition)' }}>
                    Go to Drives <span>➡️</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerOffers;
