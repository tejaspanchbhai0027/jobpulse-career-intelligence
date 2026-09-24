import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';


const AdminPlacementAudit = () => {
  // Trigger HMR
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [skip]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/placement-audit?limit=${limit}&skip=${skip}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'var(--color-success)';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'var(--color-brand-primary)';
    if (action.includes('DELETED')) return 'var(--color-danger)';
    return 'var(--color-text-secondary)';
  };

  if (loading && logs.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton height="60px" borderRadius="12px" style={{ marginBottom: '2rem' }} />
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="80px" borderRadius="8px" style={{ marginBottom: '1rem' }} />)}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>System Audit Trail</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Track all critical changes to placement records</p>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📈</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{total} Records</span>
        </div>
      </div>

      {error && <div style={{ padding: '1rem', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '150px 1fr 200px 200px', gap: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
          <div>Action</div>
          <div>Entity</div>
          <div>Actor</div>
          <div>Timestamp</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {logs.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No audit logs found.</div>
          ) : (
            logs.map((log) => (
              <div key={log._id} style={{ 
                padding: '1rem', 
                borderBottom: '1px solid var(--color-border)', 
                display: 'grid', 
                gridTemplateColumns: '150px 1fr 200px 200px', 
                gap: '1rem',
                alignItems: 'center',
                transition: 'background 0.2s',
                ':hover': { background: 'var(--color-bg)' }
              }}>
                <div>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: getActionColor(log.action),
                    background: 'var(--color-bg)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)'
                  }}>
                    {log.action}
                  </span>
                </div>
                
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                    {log.entityId?.company || log.entityId?.title || log.entityModel}
                  </div>
                  {log.details && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  <span style={{ fontSize: '1rem' }}>👤</span>
                  {log.actor?.name || 'Unknown User'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ fontSize: '1rem' }}>🕒</span>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            disabled={skip === 0}
            onClick={() => setSkip(Math.max(0, skip - limit))}
            style={{ padding: '0.5rem 1rem', background: skip === 0 ? 'var(--color-surface)' : 'var(--color-brand-primary)', color: skip === 0 ? 'var(--color-text-secondary)' : '#fff', border: 'none', borderRadius: '6px', cursor: skip === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            Previous
          </button>
          <button 
            disabled={skip + limit >= total}
            onClick={() => setSkip(skip + limit)}
            style={{ padding: '0.5rem 1rem', background: skip + limit >= total ? 'var(--color-surface)' : 'var(--color-brand-primary)', color: skip + limit >= total ? 'var(--color-text-secondary)' : '#fff', border: 'none', borderRadius: '6px', cursor: skip + limit >= total ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default AdminPlacementAudit;
