import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';

const SuperAdminInstitutionDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin creation modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/super-admin/institutions/${id}`);
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load institution details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const isDeactivating = data.institution.isActive;
    const msg = isDeactivating 
      ? `Deactivate ${data.institution.name}? Users belonging to this institution may no longer be able to perform normal institutional activities.`
      : `Reactivate ${data.institution.name}?`;
      
    if (!window.confirm(msg)) return;

    try {
      await api.patch(`/super-admin/institutions/${id}/status`, { isActive: !isDeactivating });
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const generateAdminPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminForm(prev => ({ ...prev, password: pwd }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');

    try {
      await api.post(`/super-admin/institutions/${id}/admin`, adminForm);
      setIsAdminModalOpen(false);
      fetchDetails();
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Failed to create Institution Admin');
    } finally {
      setAdminLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton height="200px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <Skeleton height="300px" borderRadius="16px" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error || 'Institution not found'}
        </div>
        <Link to="/super-admin/institutions" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
          &larr; Back to Institutions
        </Link>
      </div>
    );
  }

  const { institution, admin, stats } = data;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
        <Link to="/super-admin/institutions" style={{ color: '#667085', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          &larr; Back to Institutions
        </Link>
      </div>

      {/* Header */}
      <div style={{ 
        background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '12px', 
        border: '1px solid var(--color-border)', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1rem 0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {institution.name}
          </h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', fontWeight: 500 }}>
            <span style={{ background: 'var(--color-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
              {institution.code}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📍 {institution.city ? `${institution.city}, ${institution.state}` : 'Location not set'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✉️ {institution.contactEmail || 'No contact email'}</span>
          </div>
        </div>
        <div>
          <button 
            onClick={handleToggleStatus}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: `1px solid ${institution.isActive ? '#EF4444' : '#10B981'}`,
              background: institution.isActive ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
              color: institution.isActive ? '#EF4444' : '#10B981',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = institution.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}
            onMouseOut={(e) => e.target.style.background = institution.isActive ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)'}
          >
            {institution.isActive ? 'Deactivate Institution' : 'Activate Institution'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Institution Admin Card */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Institution Admin</h2>
          
          {admin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{admin.name}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{admin.email}</div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ 
                  background: admin.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                  color: admin.isActive ? '#10B981' : '#EF4444',
                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No admin account has been created for this institution yet.</div>
              <button 
                onClick={() => {
                  setAdminForm({ name: '', email: '', password: '' });
                  setIsAdminModalOpen(true);
                }}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                + Add Institution Admin
              </button>
            </div>
          )}
        </div>

        {/* Platform Stats Card */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Platform Adoption</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Total Students</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.studentCount}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Placement Officers</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.poCount}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Mentors</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.mentorCount}</div>
            </div>
          </div>
        </div>

      </div>

      {/* CREATE ADMIN MODAL */}
      {isAdminModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '400px',
            borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Add Admin</h2>
              <button onClick={() => setIsAdminModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>

            {adminError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {adminError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Admin Name *</label>
                <input 
                  type="text" required 
                  value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                  style={inputStyle} placeholder="e.g. Rahul Sharma"
                />
              </div>
              
              <div>
                <label style={labelStyle}>Admin Email *</label>
                <input 
                  type="email" required 
                  value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                  style={inputStyle} placeholder="rahul@example.com"
                />
              </div>

              <div>
                <label style={labelStyle}>Temporary Password *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" required 
                    value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                    style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="Enter password"
                  />
                  <button type="button" onClick={generateAdminPassword} className="btn-secondary" style={{ padding: '0 1rem' }}>
                    Gen
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAdminModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={adminLoading} className="btn-primary">
                  {adminLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)'
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: '0.95rem',
  boxSizing: 'border-box'
};

export default SuperAdminInstitutionDetails;
