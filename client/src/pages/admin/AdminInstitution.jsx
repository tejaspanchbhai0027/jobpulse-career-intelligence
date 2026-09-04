import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/ui/Skeleton';

const AdminInstitution = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    websiteUrl: '',
    placementSeason: '',
    graduationYear: '',
    departments: ''
  });

  const canEdit = user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    try {
      const { data } = await api.get('/institution/me');
      if (data.success) {
        setInstitution(data.data);
        setFormData({
          name: data.data.name || '',
          code: data.data.code || '',
          location: data.data.location || '',
          websiteUrl: data.data.websiteUrl || '',
          placementSeason: data.data.placementSeason || '',
          graduationYear: data.data.graduationYear || '',
          departments: data.data.departments ? data.data.departments.join(', ') : ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load institution data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        departments: formData.departments.split(',').map(d => d.trim()).filter(d => d)
      };
      
      const { data } = await api.put('/institution/me', payload);
      
      if (data.success) {
        setSuccess('Institution profile updated successfully!');
        setInstitution(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update institution');
    } finally {
      setSaving(false);
      
      // Clear success message after 3 seconds
      if (!error) {
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <Skeleton height="500px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>Institution Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Manage the details and configuration for your institution.</p>
      </div>

      {!canEdit && (
        <div style={{ 
          background: 'var(--color-surface-overlay)', 
          border: '1px solid var(--color-border)', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '2rem',
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem'
        }}>
          <strong>Note:</strong> You are viewing this page as a {user?.role.replace('_', ' ')}. Only Institution Admins can modify these settings.
        </div>
      )}

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

      <form 
        onSubmit={handleSubmit} 
        style={{ 
          background: 'var(--color-surface)', 
          padding: '2.5rem', 
          borderRadius: '12px', 
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Institution Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!canEdit}
              required
              style={inputStyle(canEdit)}
            />
          </div>

          {/* Code */}
          <div>
            <label style={labelStyle}>Institution Code (Immutable)</label>
            <input 
              type="text" 
              name="code"
              value={formData.code}
              disabled
              style={{ ...inputStyle(false), background: 'var(--color-bg)' }}
              title="Code cannot be changed"
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input 
              type="text" 
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={!canEdit}
              style={inputStyle(canEdit)}
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          {/* Website */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Website URL</label>
            <input 
              type="url" 
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              disabled={!canEdit}
              style={inputStyle(canEdit)}
              placeholder="https://..."
            />
          </div>

          {/* Placement Season */}
          <div>
            <label style={labelStyle}>Placement Season</label>
            <input 
              type="text" 
              name="placementSeason"
              value={formData.placementSeason}
              onChange={handleChange}
              disabled={!canEdit}
              style={inputStyle(canEdit)}
              placeholder="e.g. 2024-2025"
            />
          </div>

          {/* Graduation Year */}
          <div>
            <label style={labelStyle}>Graduation Year</label>
            <input 
              type="number" 
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
              disabled={!canEdit}
              style={inputStyle(canEdit)}
              placeholder="e.g. 2025"
            />
          </div>

          {/* Departments */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Departments (Comma separated)</label>
            <textarea 
              name="departments"
              value={formData.departments}
              onChange={handleChange}
              disabled={!canEdit}
              style={{ ...inputStyle(canEdit), minHeight: '80px', resize: 'vertical' }}
              placeholder="Computer Science, Mechanical Engineering, Business..."
            />
          </div>
        </div>

        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{
                background: 'var(--gradient-brand)',
                color: 'var(--color-white)',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.5rem'
};

const inputStyle = (canEdit) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  background: canEdit ? 'var(--color-bg)' : 'var(--color-surface-overlay)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  cursor: canEdit ? 'text' : 'not-allowed'
});

export default AdminInstitution;
