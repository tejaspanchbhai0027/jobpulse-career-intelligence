import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';

import { Link } from 'react-router-dom';

const AdminPlacementVerification = () => {
  // Trigger HMR
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/placement-verification');
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
      case 'High': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">HIGH</span>;
      case 'Medium': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">MEDIUM</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">LOW</span>;
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Data Verification Center</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Review incomplete or inconsistent placement records</p>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alerts.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {alerts.length}
          </div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            Active Alerts
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '1rem', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>All Clear!</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>No inconsistencies or missing data found in the system.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ 
              background: 'var(--color-surface)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '12px', 
              padding: '1.5rem',
              display: 'flex',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              alignItems: 'flex-start'
            }}>
              <div style={{ marginTop: '4px' }}>
                {getSeverityIcon(alert.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{alert.category}</h3>
                    {getSeverityBadge(alert.severity)}
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Record: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{alert.affectedRecord}</span>
                </div>
                
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{alert.explanation}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>Action Required: {alert.action}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to={`/admin/placement-drives`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
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

export default AdminPlacementVerification;
