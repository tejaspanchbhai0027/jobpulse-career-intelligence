import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const CreateInterventionModal = ({ preSelectedStudentId, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // Form State
  const [studentId, setStudentId] = useState(preSelectedStudentId || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [reason, setReason] = useState('');
  const [suggestedSupport, setSuggestedSupport] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const types = [
    { value: 'NO_ACTIVITY_30_DAYS', label: 'Missing activity data' },
    { value: 'HIGH_APPS_NO_INTERVIEWS', label: 'High applications, no interviews' },
    { value: 'UPCOMING_INTERVIEW_NO_PREP', label: 'Preparation support required' },
    { value: 'STALE_RESUME', label: 'Resume review recommended' },
    { value: 'ACADEMIC_CONCERN', label: 'Academic concern' },
    { value: 'BEHAVIORAL_CONCERN', label: 'Behavioral concern' },
    { value: 'OTHER', label: 'Other / Custom' }
  ];

  const priorities = ['LOW', 'MEDIUM', 'HIGH'];

  useEffect(() => {
    // Only fetch students if we don't have a pre-selected one (or if we want to show their name)
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/mentor/students?limit=1000');
        setStudents(data.data || []);
      } catch (err) {
        setError('Failed to load students.');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!reason.trim()) {
      setError('Description / Reason is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        studentId,
        title,
        type,
        priority,
        reason,
        suggestedSupport,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
      };
      await api.post(`/mentor/interventions`, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create intervention plan');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.8rem 1rem', background: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)',
    outline: 'none', fontSize: '0.95rem'
  };

  const labelStyle = {
    display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', 
    marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 17, 21, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        width: '100%', maxWidth: '600px', maxHeight: '90vh',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Create Intervention Plan
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>
            &times;
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          <form id="intervention-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Student</label>
              {preSelectedStudentId ? (
                <div style={inputStyle}>
                  {loadingStudents ? 'Loading...' : (students.find(s => s._id === preSelectedStudentId)?.name || 'Selected Student')}
                </div>
              ) : (
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle} disabled={loadingStudents}>
                  <option value="">-- Select an assigned student --</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Issue Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                style={inputStyle} 
                placeholder="e.g. Missing Application Activity"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Issue Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                  {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Description / Evidence</label>
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
                placeholder="Describe the issue or evidence..."
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Recommended Action</label>
              <textarea 
                value={suggestedSupport} 
                onChange={(e) => setSuggestedSupport(e.target.value)} 
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                placeholder="What should be done to resolve this?"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Target Resolution Date (Optional)</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                style={inputStyle} 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0, background: 'var(--color-surface)' }}>
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="intervention-form"
            disabled={loading}
            style={{ padding: '0.8rem 1.5rem', background: 'var(--color-brand-primary)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Creating...' : 'Create Action Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInterventionModal;
