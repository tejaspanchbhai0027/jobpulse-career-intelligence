import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const OfficerMentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Mentor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMentor, setNewMentor] = useState({ name: '', email: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const fetchMentors = async () => {
    try {
      const { data } = await api.get('/officer/mentors', { params: { search } });
      setMentors(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMentors();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAddMentor = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      const { data } = await api.post('/officer/mentors', newMentor);
      if (data.success) {
        setShowAddModal(false);
        setNewMentor({ name: '', email: '', password: '' });
        fetchMentors(); // Refresh the list
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add mentor');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading mentors...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-primary)' }}>Add New Mentor</h2>
            
            {addError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{addError}</div>}
            
            <form onSubmit={handleAddMentor}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={newMentor.name} 
                  onChange={e => setNewMentor({...newMentor, name: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</label>
                <input 
                  type="email" 
                  value={newMentor.email} 
                  onChange={e => setNewMentor({...newMentor, email: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Initial Password (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Defaults to JobPulse@123"
                  value={newMentor.password} 
                  onChange={e => setNewMentor({...newMentor, password: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={adding} style={{ padding: '0.5rem 1rem', background: 'var(--color-brand-primary)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer' }}>
                  {adding ? 'Adding...' : 'Add Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>My Mentors</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Manage the mentors assigned to you.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              width: '250px'
            }}
          />
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ background: 'var(--color-brand-primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>+</span> Add Mentor
          </button>
        </div>
      </div>

      {mentors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No mentors have been added yet.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Click "Add Mentor" to start building your team.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Mentor</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Students</th>
                  <th style={thStyle}>Applications</th>
                  <th style={thStyle}>Interviews</th>
                  <th style={thStyle}>Offers</th>
                  <th style={thStyle}>Open Issues</th>
                  <th style={thStyle}>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor) => (
                  <tr 
                    key={mentor._id} 
                    onClick={() => navigate(`/officer/mentors/${mentor._id}`)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mentor.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{mentor.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                        background: mentor.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: mentor.isActive ? '#10b981' : '#ef4444'
                       }}>
                        {mentor.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {mentor.studentCount}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                      {mentor.applications}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#f59e0b', fontWeight: 600 }}>
                      {mentor.interviews}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#10b981', fontWeight: 600 }}>
                      {mentor.offers}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: mentor.openInterventions > 0 ? '#f59e0b' : 'var(--color-text-secondary)', fontWeight: mentor.openInterventions > 0 ? 700 : 500 }}>
                      {mentor.openInterventions || 0}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: mentor.overdueInterventions > 0 ? '#ef4444' : 'var(--color-text-secondary)', fontWeight: mentor.overdueInterventions > 0 ? 700 : 500 }}>
                      {mentor.overdueInterventions || 0}
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

export default OfficerMentors;
