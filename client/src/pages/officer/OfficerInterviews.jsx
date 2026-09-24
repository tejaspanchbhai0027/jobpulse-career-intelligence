import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OfficerInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/officer/interviews', {
          params: { page, limit: 25 }
        });
        setInterviews(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [page]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading interviews...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const now = new Date();
  
  const filteredInterviews = interviews.filter(int => {
    const intDate = new Date(int.date);
    if (filter === 'upcoming') return intDate >= now;
    if (filter === 'completed') return intDate < now;
    if (filter === 'this_week') {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return intDate >= now && intDate <= nextWeek;
    }
    return true; // 'all'
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>🎤 Interviews</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Track and support students preparing for interviews.</p>
        </div>
        
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ 
            padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
            background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none'
          }}
        >
          <option value="all">All Interviews</option>
          <option value="upcoming">Upcoming</option>
          <option value="this_week">Next 7 Days</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredInterviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No interviews found.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>No interviews match the selected filter.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Date & Time</th>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Company & Role</th>
                  <th style={thStyle}>Round</th>
                  <th style={thStyle}>Mentor</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((int) => (
                  <tr 
                    key={int._id} 
                    onClick={() => navigate(`/officer/students/${int.student?._id}`)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {new Date(int.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{int.student?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{int.student?.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>{int.application?.company}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{int.application?.role}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      Round {int.round || 1}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      {int.student?.mentorId?.name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              borderRadius: '6px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              borderRadius: '6px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' };

export default OfficerInterviews;
