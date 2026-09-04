import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const MentorInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const { data } = await api.get('/mentor/interviews');
        setInterviews(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading interviews...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const now = new Date();
  
  const filteredInterviews = interviews.filter(int => {
    const intDate = new Date(int.scheduledAt);
    if (filter === 'upcoming') return intDate >= now;
    if (filter === 'completed') return intDate < now;
    if (filter === 'this_week') {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return intDate >= now && intDate <= nextWeek;
    }
    if (filter === 'today') {
      return intDate.toDateString() === now.toDateString();
    }
    return true; // 'all'
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>INTERVIEWS</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Track your assigned students' interviews.</p>
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
          <option value="today">Today</option>
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
                  <th style={thStyle}>DATE & TIME</th>
                  <th style={thStyle}>STUDENT</th>
                  <th style={thStyle}>COMPANY & ROLE</th>
                  <th style={thStyle}>ROUND</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((int) => (
                  <tr 
                    key={int._id} 
                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {new Date(int.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/mentor/students/${int.user?._id}`)}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{int.user?.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{int.user?.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)' }}>{int.application?.company}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{int.application?.role}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      {int.interviewType || 'Video'} • Round {int.round || 1}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                        background: 'rgba(59,130,246,0.1)', color: '#3b82f6'
                       }}>
                         {int.result || 'Scheduled'}
                       </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {int.meetingUrl ? (
                        <a 
                          href={int.meetingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            background: 'var(--color-brand-primary)',
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          Join Meeting
                        </a>
                      ) : '-'}
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

export default MentorInterviews;
