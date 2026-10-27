import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CreateDriveModal = ({ isOpen, onClose, onCreate, onUpdate, initialData }) => {
  const [form, setForm] = useState({
    title: '',
    company: '',
    jobRole: '',
    jobDescription: '',
    employmentType: 'Full-Time',
    workMode: 'On-site',
    location: '',
    salaryRange: '',
    registrationStartDate: '',
    registrationEndDate: '',
    driveDate: '',
    venue: '',
    applicationUrl: '',
    selectionProcess: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      setForm({
        ...initialData,
        registrationStartDate: initialData.registrationStartDate ? new Date(initialData.registrationStartDate).toISOString().split('T')[0] : '',
        registrationEndDate: initialData.registrationEndDate ? new Date(initialData.registrationEndDate).toISOString().split('T')[0] : '',
        driveDate: initialData.driveDate ? new Date(initialData.driveDate).toISOString().split('T')[0] : '',
      });
    } else if (isOpen) {
      setForm({
        title: '', company: '', jobRole: '', jobDescription: '', employmentType: 'Full-Time', workMode: 'On-site',
        location: '', salaryRange: '', registrationStartDate: '', registrationEndDate: '', driveDate: '', venue: '',
        applicationUrl: '', selectionProcess: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = initialData ? await onUpdate(initialData._id, form) : await onCreate(form);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message);
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
        borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '2rem',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{initialData ? 'Edit Placement Drive' : 'Create Placement Drive'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>

        {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Drive Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Company</label>
              <input type="text" name="company" value={form.company} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Job Role</label>
              <input type="text" name="jobRole" value={form.jobRole} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Salary Range (Package)</label>
              <input type="text" name="salaryRange" value={form.salaryRange} onChange={handleChange} style={inputStyle} placeholder="e.g. ₹8-12 LPA" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Job Description</label>
            <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} required></textarea>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Application URL / Apply Link</label>
            <input type="url" name="applicationUrl" value={form.applicationUrl} onChange={handleChange} style={inputStyle} placeholder="https://company.com/careers/apply" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Selection Process</label>
            <textarea name="selectionProcess" value={form.selectionProcess} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="E.g., 1. Aptitude Test -> 2. Technical Interview -> 3. HR Round"></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Employment Type</label>
              <select name="employmentType" value={form.employmentType} onChange={handleChange} style={inputStyle}>
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Apprenticeship">Apprenticeship</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Work Mode</label>
              <select name="workMode" value={form.workMode} onChange={handleChange} style={inputStyle}>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Venue (if any)</label>
              <input type="text" name="venue" value={form.venue} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Reg Start Date</label>
              <input type="date" name="registrationStartDate" value={form.registrationStartDate} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Reg End Date</label>
              <input type="date" name="registrationEndDate" value={form.registrationEndDate} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Drive Date</label>
              <input type="date" name="driveDate" value={form.driveDate} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem', marginTop: '1rem', borderRadius: '10px' }}>
            {loading ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Drive')}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateDriveModal;
