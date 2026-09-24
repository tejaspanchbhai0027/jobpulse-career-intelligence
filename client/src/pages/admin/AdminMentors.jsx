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
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>Mentors Overview</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>View all mentors assigned to placement officers within your institution.</p>
        </div>
        <button className="btn-primary" onClick={() => {
          const name = window.prompt("Enter Mentor Name:");
          if (!name) return;
          const email = window.prompt("Enter Mentor Email:");
          if (!email) return;
          
          api.post('/admin/mentors', { name, email })
            .then(() => fetchMentors())
            .catch(err => alert('Failed to create mentor: ' + (err.response?.data?.message || err.message)));
        }}>+ Add Mentor</button>
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
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mentors.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
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
                    <td style={tdStyle}>
                      <button 
                        style={{ marginRight: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => {
                          const newName = window.prompt("Edit Mentor Name:", mentor.name);
                          if (newName && newName !== mentor.name) {
                            api.patch(`/admin/mentors/${mentor._id}`, { name: newName })
                              .then(() => fetchMentors())
                              .catch(err => alert('Failed to update mentor: ' + err.message));
                          }
                        }}
                      >Edit</button>
                      
                      {mentor.isActive && (
                        <button 
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to deactivate this mentor?')) {
                              api.delete(`/admin/mentors/${mentor._id}`)
                                .then(() => fetchMentors())
                                .catch(err => alert('Failed to deactivate mentor: ' + err.message));
                            }
                          }}
                        >Deactivate</button>
                      )}
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
