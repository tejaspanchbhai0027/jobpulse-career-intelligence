import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AdminOfficers = () => {
  const { user } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: user?.role === 'PLACEMENT_OFFICER' ? 'MENTOR' : 'PLACEMENT_OFFICER' });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    action: ''
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const { data } = await api.get('/admin/officers');
      if (data.success) {
        setOfficers(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChange = (e) => {
    setInviteData({ ...inviteData, [e.target.name]: e.target.value });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/admin/officers', inviteData);
      if (data.success) {
        setOfficers([...officers, data.data]);
        setShowInvite(false);
        setInviteData({ name: '', email: '', role: 'PLACEMENT_OFFICER' });
        setSuccess(data.message || 'Officer invited successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite officer');
      setTimeout(() => setError(''), 5000);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveClick = (id) => {
    setConfirmModal({ isOpen: true, id, action: 'remove' });
  };

  const handleToggleClick = (id, currentStatus) => {
    setConfirmModal({ isOpen: true, id, action: currentStatus ? 'deactivate' : 'activate' });
  };

  const executeAction = async () => {
    const { id, action } = confirmModal;
    if (!id || !action) return;

    try {
      if (action === 'remove') {
        const { data } = await api.delete(`/admin/officers/${id}`);
        if (data.success) {
          setOfficers(officers.filter(o => o._id !== id));
          setSuccess('Officer removed successfully');
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        const isActive = action === 'activate';
        const { data } = await api.patch(`/admin/officers/${id}`, { isActive });
        if (data.success) {
          setOfficers(officers.map(o => o._id === id ? data.data : o));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} officer`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmModal({ isOpen: false, id: null, action: '' });
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading team members...</div>;
  }

  // Security check fallback (should also be guarded by Sidebar/Routing)
  // Security check fallback
  if (user?.role !== 'INSTITUTION_ADMIN' && user?.role !== 'PLACEMENT_OFFICER') {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>
        Access Denied. Only Institution Admins and Placement Officers can manage team members.
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <button 
          onClick={() => setShowInvite(true)} 
          style={{
            background: 'var(--gradient-brand)',
            color: 'var(--color-white)',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Add Placement Officer
        </button>
      </div>

      {error && (
        <div style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'transparent', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {/* TEAM TABLE */}
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
                <th style={thStyle}>Officer</th>
                <th style={thStyle}>Mentors</th>
                <th style={thStyle}>Students</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Last Login</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No team members found.
                  </td>
                </tr>
              ) : (
                officers.map(officer => (
                  <tr key={officer._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{officer.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{officer.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{officer.mentorCount || 0}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{officer.studentCount || 0}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: officer.isActive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: officer.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {officer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {officer.lastLogin ? new Date(officer.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          onClick={() => {
                            const newName = window.prompt("Edit Officer Name:", officer.name);
                            if (newName && newName !== officer.name) {
                              api.patch(`/admin/officers/${officer._id}`, { name: newName })
                                .then(() => fetchOfficers())
                                .catch(err => alert('Failed to update officer: ' + err.message));
                            }
                          }}
                          disabled={officer._id === user.id}
                          style={{
                            background: 'transparent',
                            color: 'var(--color-brand-primary)',
                            border: '1px solid var(--color-brand-primary)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: officer._id === user.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleClick(officer._id, officer.isActive)}
                          disabled={officer._id === user.id}
                          style={{
                            background: 'transparent',
                            color: 'var(--color-brand-primary)',
                            border: '1px solid var(--color-border)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: officer._id === user.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {officer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleRemoveClick(officer._id)}
                          disabled={officer._id === user.id}
                          style={{
                            background: 'transparent',
                            color: 'var(--color-danger)',
                            border: '1px solid var(--color-danger)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: officer._id === user.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Invite Team Member</h2>
            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={inviteData.name} 
                  onChange={handleInviteChange}
                  required
                  style={inputStyle}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={inviteData.email} 
                  onChange={handleInviteChange}
                  required
                  style={inputStyle}
                  placeholder="john@example.com"
                />
              </div>
              <div style={{ display: 'none' }}>
                <input type="hidden" name="role" value="PLACEMENT_OFFICER" />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowInvite(false)}
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    background: 'var(--gradient-brand)',
                    color: 'var(--color-white)',
                    border: 'none',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: inviteLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'remove' ? 'Remove Officer' : confirmModal.action === 'deactivate' ? 'Deactivate Officer' : 'Activate Officer'}
        message={confirmModal.action === 'remove' ? 'Are you sure you want to permanently remove this officer? This action cannot be undone.' : confirmModal.action === 'deactivate' ? 'Are you sure you want to deactivate this officer?' : 'Are you sure you want to activate this officer?'}
        confirmText={confirmModal.action === 'remove' ? 'Remove' : confirmModal.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        isDestructive={confirmModal.action === 'remove' || confirmModal.action === 'deactivate'}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, action: '' })}
      />
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
  verticalAlign: 'middle'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text-primary)',
  fontSize: '0.95rem'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: 'var(--color-surface)',
  padding: '2rem',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '450px',
  border: '1px solid var(--color-border)'
};

export default AdminOfficers;
