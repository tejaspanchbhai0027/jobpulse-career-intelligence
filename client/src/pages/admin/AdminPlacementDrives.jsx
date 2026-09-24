import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminPlacementDrives = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PLACEMENT_OFFICER'
  });

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/officers');
      if (data.success) {
        setOfficers(data.data.filter(o => o.role === 'PLACEMENT_OFFICER'));
      }
    } catch (err) {
      setError('Failed to load placement officers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/officers', formData);
      if (data.success) {
        alert('Placement Officer created successfully!');
        setShowForm(false);
        setFormData({ name: '', email: '', password: '', role: 'PLACEMENT_OFFICER' });
        fetchOfficers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create placement officer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this placement officer?')) {
      try {
        const { data } = await api.delete(`/admin/officers/${id}`);
        if (data.success) {
          fetchOfficers();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete placement officer');
      }
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Placement Officers</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Manage placement officers for your institution</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: 'var(--color-brand-primary)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Create a placement officer'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Create Placement Officer</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" name="password" placeholder="Enter a secure password" value={formData.password} onChange={handleChange} required style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
              <button type="submit" style={{ padding: '12px 24px', background: 'var(--color-brand-primary)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                Create Placement Officer
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : officers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No placement officers created yet.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-bg)' }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map(officer => (
                <tr key={officer._id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{officer.name}</div>
                  </td>
                  <td style={tdStyle}>{officer.email}</td>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleDelete(officer._id)}
                        style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  outline: 'none'
};

const thStyle = {
  padding: '16px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  color: 'var(--color-text-primary)'
};

export default AdminPlacementDrives;
