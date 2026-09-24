import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { TableSkeleton } from '../../components/ui/Skeleton';

const SuperAdminInstitutions = () => {
  const [data, setData] = useState({ institutions: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [createdInstId, setCreatedInstId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instToDelete, setInstToDelete] = useState(null);
  
  const [form, setForm] = useState({
    name: '', code: '', city: '', state: '', contactEmail: ''
  });

  const handleDeleteClick = (inst) => {
    setInstToDelete(inst);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      await api.delete(`/super-admin/institutions/${instToDelete._id}`);
      setIsDeleteModalOpen(false);
      setInstToDelete(null);
      fetchInstitutions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete institution');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstitutions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, data.page]);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/super-admin/institutions?page=${data.page}&limit=10&search=${search}&status=${statusFilter}`);
      if (res.data.success) {
        setData({
          institutions: res.data.data,
          total: res.data.total,
          page: res.data.page,
          totalPages: res.data.totalPages
        });
      }
    } catch (err) {
      setError('Failed to load institutions.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setData(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.post('/super-admin/institutions', form);
      setCreatedInstId(res.data.data._id);
      setModalStep(2);
      fetchInstitutions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create institution');
    } finally {
      setFormLoading(false);
    }
  };

  const openModal = () => {
    setForm({ name: '', code: '', city: '', state: '', contactEmail: '' });
    setFormError('');
    setModalStep(1);
    setIsModalOpen(true);
  };

  return (
    <div style={{ width: '100%' }}>
        
        {/* Simple Clean Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Institutions Directory</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>Manage client institutions, roles, and administrative access.</p>
          </div>
          <div>
            <button onClick={openModal} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '0.9rem', borderRadius: '8px' }}>
              + Create Institution
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by institution name or unique code..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setData(prev => ({ ...prev, page: 1 }));
              }}
              style={{ 
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                borderRadius: '8px', border: '1px solid var(--color-border)', 
                background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              className="focus:border-[var(--color-brand-primary)]"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setData(prev => ({ ...prev, page: 1 }));
            }}
            style={{
              padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text-primary)',
              fontSize: '0.95rem', outline: 'none', cursor: 'pointer', minWidth: '150px'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Clean Table */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={thStyle}>Institution</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Students</th>
                  <th style={thStyle}>Plcmt. Officers</th>
                  <th style={thStyle}>Mentors</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && data.institutions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: 0 }}>
                      <TableSkeleton rows={10} cols={7} />
                    </td>
                  </tr>
                ) : data.institutions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No institutions matched your search.
                    </td>
                  </tr>
                ) : (
                  data.institutions.map((inst) => (
                    <tr key={inst._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover:bg-[var(--color-surface-raised)]">
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{inst.name}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>{inst.code}</span>
                          {!inst.hasAdmin && (
                            <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              Needs Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {inst.city ? `${inst.city}${inst.state ? `, ${inst.state}` : ''}` : '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          color: inst.isActive ? '#10B981' : '#EF4444',
                          background: inst.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: inst.isActive ? '#10B981' : '#EF4444' }}></div>
                          {inst.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{...tdStyle, color: 'var(--color-text-secondary)', fontWeight: 500}}>{inst.studentCount}</td>
                      <td style={{...tdStyle, color: 'var(--color-text-secondary)', fontWeight: 500}}>{inst.poCount}</td>
                      <td style={{...tdStyle, color: 'var(--color-text-secondary)', fontWeight: 500}}>{inst.mentorCount}</td>
                      <td style={{...tdStyle, textAlign: 'right'}}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                          <Link to={`/super-admin/institutions/${inst._id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }} className="hover:underline">
                            View Details
                          </Link>
                          <button onClick={() => handleDeleteClick(inst)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Institution">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data.totalPages > 0 && (
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Showing {(data.page - 1) * 10 + 1} to {Math.min(data.page * 10, data.total)} of {data.total} institutions
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button disabled={data.page === 1} onClick={() => handlePageChange(data.page - 1)} style={pageBtnStyle(data.page === 1)}>Prev</button>
                <div style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{data.page}</div>
                <button disabled={data.page === data.totalPages} onClick={() => handlePageChange(data.page + 1)} style={pageBtnStyle(data.page === data.totalPages)}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--color-danger)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Delete Institution?</h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                You are about to permanently delete <strong>{instToDelete?.name} ({instToDelete?.code})</strong>.
              </p>
              <p style={{ color: 'var(--color-danger)', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                WARNING: This action is irreversible. All users, students, placement officers, mentors, applications, interviews, and drives associated with this institution will be permanently deleted.
              </p>
              
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setInstToDelete(null); setFormError(''); }} style={{...pageBtnStyle(false), border: 'none', background: 'transparent'}}>Cancel</button>
                <button type="button" onClick={confirmDelete} disabled={formLoading} style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1 }}>
                  {formLoading ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Creation Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>New Institution</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
              </div>

              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  {formError}
                </div>
              )}

              {modalStep === 1 ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Institution Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="e.g. Acme University" />
                  </div>
                  <div>
                    <label style={labelStyle}>Institution Code *</label>
                    <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace' }} placeholder="e.g. ACM2026" />
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Unique identifier for student registration.</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} placeholder="e.g. New York" />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={inputStyle} placeholder="e.g. NY" />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Email</label>
                    <input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} style={inputStyle} placeholder="admin@acme.edu" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{...pageBtnStyle(false), border: 'none', background: 'transparent'}}>Cancel</button>
                    <button type="submit" disabled={formLoading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                      {formLoading ? 'Creating...' : 'Create Institution'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: '#10B981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Institution Created Successfully</h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>The institution profile has been created. You can now provision an administrative account for it.</p>
                  <Link to={`/super-admin/institutions/${createdInstId}`} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                    Provision Admin Account &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

const thStyle = {
  padding: '1.25rem 1.5rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1.25rem 1.5rem',
  verticalAlign: 'middle'
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

const pageBtnStyle = (disabled) => ({
  background: 'var(--color-surface)',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  padding: '0.4rem 1rem',
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem'
});

export default SuperAdminInstitutions;
