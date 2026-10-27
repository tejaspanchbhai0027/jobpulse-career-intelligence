import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MentorConnectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/mentor/student-connection-requests');
      setRequests(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch connection requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      let endpoint = `/mentor/student-connection-requests/${id}/${action}`;
      let payload = {};
      
      if (action === 'reject') {
        const reason = window.prompt("Reason for rejection (optional):");
        if (reason === null) return; // User cancelled
        payload = { rejectionReason: reason };
      }

      await api.patch(endpoint, payload);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading connection requests...</div>;
  }

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Connection Requests
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage students requesting to join your institution under your mentorship.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(p => (
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
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', margin: '0 auto 1rem auto', width: '60px', height: '60px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No {filter.toLowerCase()} requests.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredRequests.map((req) => (
            <div key={req._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                  {req.studentId?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
                    {req.studentId?.name || 'Unknown Student'}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>📧 {req.studentId?.email || 'N/A'}</span>
                    <span>📅 Requested on {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: `${getStatusColor(req.status)}20`, color: getStatusColor(req.status) }}>
                  {req.status}
                </span>

                {req.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleAction(req._id, 'reject')}
                      style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, 'approve')}
                      style={{ background: 'var(--gradient-brand)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorConnectionRequests;
