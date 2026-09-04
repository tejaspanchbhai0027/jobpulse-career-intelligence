import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    contactEmail: ''
  });

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

  const openModal = () => {
    setForm({ name: '', code: '', city: '', state: '', contactEmail: '' });
    setFormError('');
    setModalStep(1);
    setCreatedInstId(null);
    setIsModalOpen(true);
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

  const Badge = ({ children, color }) => (
    <span style={{
      background: 'var(--color-bg)',
      color: color,
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 700,
      border: `1px solid ${color === 'var(--color-text-secondary)' ? 'var(--color-border)' : color}`
    }}>
      {children}
    </span>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Institutions</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Manage all client institutions on the platform.</p>
        </div>
        <button onClick={openModal} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}>
          + Add Institution
        </button>
      </div>

      {error && (
        <div style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search by institution name or code..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setData(prev => ({ ...prev, page: 1 }));
          }}
          style={{ 
            flex: 1, minWidth: '250px', maxWidth: '400px', padding: '0.75rem 1rem', 
            borderRadius: '8px', border: '1px solid var(--color-border)', 
            background: 'var(--color-surface)', color: 'var(--color-text-primary)',
            fontSize: '0.95rem', outline: 'none'
          }}
        />
        <select 
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setData(prev => ({ ...prev, page: 1 }));
          }}
          style={{
            padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
            background: 'var(--color-surface)', color: 'var(--color-text-primary)',
            fontSize: '0.95rem', outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={thStyle}>Institution</th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Students</th>
                <th style={thStyle}>Officers</th>
                <th style={thStyle}>Mentors</th>
                <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.institutions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 0 }}>
                    <TableSkeleton rows={10} cols={8} />
                  </td>
                </tr>
              ) : data.institutions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No institutions found.
                  </td>
                </tr>
              ) : (
                data.institutions.map(inst => (
                  <tr key={inst._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{inst.name}</div>
                      {!inst.hasAdmin && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '2px' }}>
                          ⚠️ No Admin
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span 
                        onClick={() => {
                          navigator.clipboard.writeText(inst.code);
                          alert('Copied to clipboard');
                        }}
                        style={{ background: 'var(--color-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                        title="Click to copy"
                      >
                        {inst.code} 📋
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {inst.city ? `${inst.city}${inst.state ? `, ${inst.state}` : ''}` : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <Badge color={inst.isActive ? 'var(--color-success)' : 'var(--color-danger)'}>
                        {inst.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{inst.studentCount}</td>
                    <td style={tdStyle}>{inst.poCount}</td>
                    <td style={tdStyle}>{inst.mentorCount}</td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <Link to={`/super-admin/institutions/${inst._id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-overlay)' }}>
            <button disabled={data.page === 1} onClick={() => handlePageChange(data.page - 1)} style={pageBtnStyle(data.page === 1)}>Previous</button>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Page {data.page} of {data.totalPages}</span>
            <button disabled={data.page === data.totalPages} onClick={() => handlePageChange(data.page + 1)} style={pageBtnStyle(data.page === data.totalPages)}>Next</button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '500px',
            borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Create Institution</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {formError}
              </div>
            )}

            {modalStep === 1 ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Institution Name *</label>
                  <input 
                    type="text" required 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    style={inputStyle} placeholder="e.g. ABC Institute of Technology"
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>Institution Code *</label>
                  <input 
                    type="text" required 
                    value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                    style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace' }} placeholder="e.g. ABC2026"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Students will use this code during registration.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} placeholder="e.g. Mumbai" />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={inputStyle} placeholder="e.g. Maharashtra" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} style={inputStyle} placeholder="placement@abc.edu" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{...pageBtnStyle(false), border: 'none'}}>Cancel</button>
                  <button type="submit" disabled={formLoading} className="btn-primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
                    {formLoading ? 'Creating...' : 'Create Institution'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Institution Created Successfully!</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>You must now create an Institution Admin so they can log in and manage this institution.</p>
                <Link to={`/super-admin/institutions/${createdInstId}`} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', background: '#3B82F6', borderColor: '#3B82F6' }}>
                  Continue to Create Admin &rarr;
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
  padding: '1rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1rem 0.75rem',
  fontSize: '0.9rem'
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

const pageBtnStyle = (disabled) => ({
  background: disabled ? 'var(--color-bg)' : 'var(--color-surface)',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600
});

export default SuperAdminInstitutions;
