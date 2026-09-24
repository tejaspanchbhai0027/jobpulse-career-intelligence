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

  // Edit Institution modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

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
      ? `Archive/Deactivate ${data.institution.name}? Users belonging to this institution will not be able to log in or access placement records until reactivated.`
      : `Reactivate ${data.institution.name}?`;
      
    if (!window.confirm(msg)) return;

    try {
      await api.patch(`/super-admin/institutions/${id}/status`, { isActive: !isDeactivating });
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: data.institution.name,
      city: data.institution.city || '',
      state: data.institution.state || '',
      contactEmail: data.institution.contactEmail || '',
      websiteUrl: data.institution.websiteUrl || ''
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditInstitution = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      await api.patch(`/super-admin/institutions/${id}`, editForm);
      setIsEditModalOpen(false);
      fetchDetails();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update institution');
    } finally {
      setEditLoading(false);
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
    <div style={{ width: '100%' }}>
        <Link to="/super-admin/institutions" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontWeight: 600, fontSize: '0.9rem' }} className="hover:text-[var(--color-text-primary)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Institutions Directory
        </Link>

        {/* Clean Header Profile */}
        <div style={{ 
          background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '16px', 
          border: '1px solid var(--color-border)', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                {institution.name.substring(0, 1).toUpperCase()}
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {institution.name}
              </h1>
            </div>
            
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', fontWeight: 500 }}>
              <span style={{ background: 'var(--color-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {institution.code}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {institution.city ? `${institution.city}, ${institution.state}` : 'Location not set'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                {institution.contactEmail || 'No contact email'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={openEditModal} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-[var(--color-surface-raised)]">
              Edit Details
            </button>
            <button 
              onClick={handleToggleStatus}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px',
                border: `1px solid ${institution.isActive ? '#EF4444' : '#10B981'}`,
                background: institution.isActive ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                color: institution.isActive ? '#EF4444' : '#10B981',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = institution.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}
              onMouseOut={(e) => e.target.style.background = institution.isActive ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)'}
            >
              {institution.isActive ? 'Archive Institution' : 'Activate Institution'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Institution Admin Configuration */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: 0 }}>Administrator Provisioning</h2>
              {admin && (
                <span style={{ background: admin.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: admin.isActive ? '#10B981' : '#EF4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {admin.isActive ? 'Account Active' : 'Account Suspended'}
                </span>
              )}
            </div>
            
            {admin ? (
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {admin.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{admin.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{admin.email}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Created {new Date(admin.createdAt).toLocaleDateString()}</span>
                  <button style={{ background: 'transparent', border: 'none', color: '#3B82F6', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }} className="hover:underline">Reset Access</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                <svg style={{ margin: '0 auto 1rem auto', color: 'var(--color-text-muted)' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>No Administrator Assigned</div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>This institution requires a primary admin account to manage placement operations.</div>
                <button onClick={() => { setAdminForm({ name: '', email: '', password: '' }); setIsAdminModalOpen(true); }} className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '8px' }}>
                  Provision Account
                </button>
              </div>
            )}
          </div>

          {/* User Metrics */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Population Metrics</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                  Total Students
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text-primary)' }}>{stats.studentCount}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Placement Officers
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text-primary)' }}>{stats.poCount}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Mentors
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--color-text-primary)' }}>{stats.mentorCount}</div>
              </div>
            </div>
          </div>

        </div>

        {/* CREATE ADMIN MODAL */}
        {isAdminModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '450px', borderRadius: '16px', padding: '2.5rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 300, margin: 0, color: 'var(--color-text-primary)' }}>Provision Admin Account</h2>
                <button onClick={() => setIsAdminModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
              </div>

              {adminError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {adminError}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Administrator Name</label>
                  <input type="text" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} style={inputStyle} placeholder="Full Name" />
                </div>
                
                <div>
                  <label style={labelStyle}>Email Address (Login ID)</label>
                  <input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} style={inputStyle} placeholder="admin@institution.edu" />
                </div>

                <div>
                  <label style={labelStyle}>Temporary Password</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="Secure password" />
                    <button type="button" onClick={generateAdminPassword} className="btn-secondary" style={{ padding: '0 1rem', borderRadius: '8px' }}>Gen</button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Please share this password securely with the administrator.</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsAdminModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={adminLoading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                    {adminLoading ? 'Provisioning...' : 'Provision Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT INSTITUTION MODAL */}
        {isEditModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2.5rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 300, margin: 0, color: 'var(--color-text-primary)' }}>Institution Settings</h2>
                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
              </div>

              {editError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Institution Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={editForm.contactEmail} onChange={e => setEditForm({...editForm, contactEmail: e.target.value})} style={inputStyle} />
                </div>
                
                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input type="url" value={editForm.websiteUrl} onChange={e => setEditForm({...editForm, websiteUrl: e.target.value})} style={inputStyle} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={editLoading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                    {editLoading ? 'Saving...' : 'Save Configuration'}
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
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

export default SuperAdminInstitutionDetails;
