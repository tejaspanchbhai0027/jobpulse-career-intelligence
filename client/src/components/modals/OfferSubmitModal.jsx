import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';

const OfferSubmitModal = ({ isOpen, onClose, application, onSuccess }) => {
  const [form, setForm] = useState({
    companyName: application?.company || '',
    jobRole: application?.role || '',
    package: '',
    offerDate: new Date().toISOString().split('T')[0],
    joiningDate: '',
    proofFileUrl: '',
    proofFile: null,
    proofType: 'Offer Letter',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    if (e.target.name === 'proofFile') {
      setForm({ ...form, proofFile: e.target.files[0], proofFileUrl: '' });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.proofFile && !form.proofFileUrl) {
      setError('A valid Proof Document is required.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      if (application?._id) formData.append('applicationId', application._id);
      if (application?.placementDriveId) formData.append('placementDriveId', application.placementDriveId);

      await api.post('/offers/student', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit offer.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    color: 'var(--color-text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)',
        borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Submit Offer Verification</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>

        {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Company Name</label>
            <input type="text" name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Job Role</label>
            <input type="text" name="jobRole" value={form.jobRole} onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Package / CTC</label>
            <input type="text" name="package" value={form.package} onChange={handleChange} placeholder="e.g. ₹8 LPA" style={inputStyle} required />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Offer Date</label>
              <input type="date" name="offerDate" value={form.offerDate} onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Joining Date (Optional)</label>
              <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Proof Type</label>
            <select name="proofType" value={form.proofType} onChange={handleChange} style={inputStyle}>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Appointment Letter">Appointment Letter</option>
              <option value="Joining Letter">Joining Letter</option>
              <option value="Company ID Card">Company ID Card</option>
            </select>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--color-border)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Upload Proof Document (Required)</label>
            <input type="file" name="proofFile" accept=".pdf,image/*" onChange={handleChange} style={{ ...inputStyle, padding: '0.5rem' }} />
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>OR</div>
            <input type="url" name="proofFileUrl" value={form.proofFileUrl} onChange={handleChange} placeholder="Paste document URL here..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Additional Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', marginTop: '1rem', borderRadius: '10px' }}>
            {loading ? 'Submitting...' : 'Submit Offer for Verification'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default OfferSubmitModal;
