import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OfficerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data } = await api.get('/officer/applications');
        setApplications(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading application intelligence...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const filteredApplications = statusFilter === 'ALL' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>📁 Applications</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Institution-wide application monitoring and tracking.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {['ALL', 'Applied', 'Interview', 'Offer', 'Rejected'].map(s => (
            <button 
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: statusFilter === s ? 'var(--color-surface)' : 'transparent',
                color: statusFilter === s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: statusFilter === s ? 700 : 600,
                boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No applications found.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>No applications match the selected status.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Company & Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Mentor</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr 
                    key={app._id} 
                    onClick={() => navigate(`/officer/students/${app.user?._id}`)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{app.user?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{app.user?.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{app.companyName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.jobTitle}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        background: app.status === 'Offer' ? 'rgba(16,185,129,0.1)' : 
                                    app.status === 'Interview' ? 'rgba(245,158,11,0.1)' :
                                    app.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-overlay)',
                        color: app.status === 'Offer' ? '#10b981' : 
                               app.status === 'Interview' ? '#f59e0b' :
                               app.status === 'Rejected' ? '#ef4444' : 'var(--color-text-secondary)'
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      {app.user?.mentorId?.name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' };

export default OfficerApplications;
