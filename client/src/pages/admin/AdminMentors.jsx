import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminMentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const { data } = await api.get('/admin/mentors');
      if (data.success) {
        setMentors(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading mentors...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>Mentors Overview</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>View all mentors assigned to placement officers within your institution.</p>
      </div>

      {error && (
        <div style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* MENTORS TABLE */}
      <div style={{ 
        background: 'var(--color-surface)', 
        border: '1px solid var(--color-border)', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={thStyle}>Mentor Name</th>
                <th style={thStyle}>Placement Officer</th>
                <th style={thStyle}>Students Assigned</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mentors.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No mentors have been added yet.
                  </td>
                </tr>
              ) : (
                mentors.map(mentor => (
                  <tr key={mentor._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mentor.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{mentor.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {mentor.placementOfficer}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{mentor.studentCount}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: mentor.isActive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: mentor.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {mentor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '1rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.95rem',
  color: 'var(--color-text-primary)'
};

export default AdminMentors;
