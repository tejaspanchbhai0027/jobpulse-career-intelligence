import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useApplications from '../../hooks/useApplications';
import { useAllInterviews } from '../../hooks/useInterviews';

const TaskModal = ({ isOpen, onClose, onSave, task, saving }) => {
  const { applications } = useApplications();
  const { interviews } = useAllInterviews();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'General',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
    application: '',
    interview: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'General',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        application: task.application?._id || task.application || '',
        interview: task.interview?._id || task.interview || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        type: 'General',
        dueDate: '',
        priority: 'Medium',
        status: 'Pending',
        application: '',
        interview: '',
      });
    }
    setError(null);
  }, [task, isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    
    // Convert empty strings to null for optional references
    const payload = {
      ...form,
      application: form.application || null,
      interview: form.interview || null,
      dueDate: form.dueDate || null,
    };
    
    onSave(payload);
  };

  if (!isOpen) return null;

  const inputStyle = { width: '100%', padding: '0.75rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.95rem' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-[600px] flex flex-col"
        style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '16px', maxHeight: '90vh', animation: 'slide-up 0.2s ease',
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {task ? 'Edit Task' : 'New Task'}
          </h3>
          <button onClick={onClose} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}
          
          <form id="task-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Title <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Follow up with recruiter" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                  {['Application Follow-Up', 'Interview Preparation', 'Assessment', 'Resume', 'Networking', 'General'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Link to Item (Optional)</h4>
              <div>
                <label style={labelStyle}>Related Application</label>
                <select name="application" value={form.application} onChange={handleChange} style={inputStyle}>
                  <option value="">None</option>
                  {applications.map(app => (
                    <option key={app._id} value={app._id}>{app.company} - {app.role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Related Interview</label>
                <select name="interview" value={form.interview} onChange={handleChange} style={inputStyle}>
                  <option value="">None</option>
                  {interviews.map(iv => (
                    <option key={iv._id} value={iv._id}>
                      {iv.application?.company || 'Company'} - {iv.type} ({new Date(iv.scheduledAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description / Notes</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Task details..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--color-surface)' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" form="task-form" disabled={saving} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--color-brand-primary)', border: 'none', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskModal;
