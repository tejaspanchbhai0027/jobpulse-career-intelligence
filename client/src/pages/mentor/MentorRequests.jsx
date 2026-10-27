import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MentorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/mentor/student-connection-requests');
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      setError('Failed to fetch connection requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/mentor/student-connection-requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await api.patch(`/mentor/student-connection-requests/${id}/reject`, { rejectionReason: reason });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading connection requests...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Student Connection Requests</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', borderRadius: '12px' }}>
            No connection requests found.
          </div>
        ) : (
          requests.map(req => (
            <div key={req._id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.1rem' }}>{req.studentId?.name}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Email: {req.studentId?.email}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Requested on: {new Date(req.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                    backgroundColor: req.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : req.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: req.status === 'PENDING' ? '#b45309' : req.status === 'APPROVED' ? '#047857' : '#b91c1c'
                  }}>
                    {req.status}
                  </span>
                </div>
                {req.rejectionReason && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <strong>Reason:</strong> {req.rejectionReason}
                  </div>
                )}
              </div>
              
              {req.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => handleReject(req._id)}
                    style={{
                      padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border)',
                      borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--color-text-secondary)'
                    }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(req._id)}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MentorRequests;
