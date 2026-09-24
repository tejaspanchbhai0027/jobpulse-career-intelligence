import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Toast from '../components/ui/Toast';

const Resume = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [editingResume, setEditingResume] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', version: '', targetRole: '', notes: '' });

  useEffect(() => {
    fetchResumes();
  }, []);

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchResumes = async () => {
    setResumeLoading(true);
    try {
      const { data } = await api.get('/resumes');
      setResumes(data.data);
    } catch (err) {
      addToast('Error', 'Failed to fetch resumes', 'error');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      return addToast('Invalid File', 'Only PDF or Word documents are allowed', 'error');
    }

    if (file.size > 5 * 1024 * 1024) {
      return addToast('File Too Large', 'Maximum file size is 5MB', 'error');
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('name', file.name.split('.').slice(0, -1).join('.') || 'My Resume');

    setUploading(true);
    try {
      await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('Success', 'Resume uploaded and parsed successfully!', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Upload Failed', err.response?.data?.message || 'Failed to upload resume', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const setAsDefault = async (id) => {
    try {
      await api.patch(`/resumes/${id}/default`);
      addToast('Success', 'Default resume updated', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Error', 'Failed to set default', 'error');
    }
  };

  const openEditModal = (resume) => {
    setEditingResume(resume);
    setEditForm({
      name: resume.name || '',
      version: resume.version || '',
      targetRole: resume.targetRole || '',
      notes: resume.notes || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/resumes/${editingResume._id}`, editForm);
      addToast('Success', 'Resume metadata updated', 'success');
      setEditingResume(null);
      fetchResumes();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to update metadata', 'error');
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      addToast('Success', 'Resume deleted', 'success');
      fetchResumes();
    } catch (err) {
      addToast('Error', 'Failed to delete resume', 'error');
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', paddingTop: '96px', paddingBottom: '32px' }}>
      
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '32px 32px 24px 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
          Assets
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
          Resume Center
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Your Resumes</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Upload resumes to power up application autocomplete and intelligence.</p>
              </div>
            </div>

            {/* Upload Area */}
            <div style={{ 
              border: '2px dashed var(--color-border)', 
              borderRadius: '16px', 
              padding: '48px 24px', 
              textAlign: 'center', 
              background: 'var(--color-bg)',
              marginBottom: '32px',
              transition: 'var(--transition)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.8 }}>📄</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Drag & drop your resume</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>PDF or Word documents up to 5MB</p>
              
              <input type="file" id="resumeUpload" style={{ display: 'none' }} accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="resumeUpload" className="btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block', fontSize: '0.95rem', borderRadius: '999px' }}>
                {uploading ? 'Uploading...' : 'Browse Files'}
              </label>
            </div>

            {resumeLoading ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>Loading resumes...</div>
            ) : resumes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No resumes uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {resumes.map(res => (
                  <div key={res._id} style={{ 
                    display: 'flex', flexDirection: 'column', 
                    padding: '24px', 
                    background: 'var(--color-surface)', 
                    borderRadius: '16px', 
                    border: res.isDefault ? '2px solid var(--color-brand-primary)' : '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                    position: 'relative'
                  }}>
                    {res.isDefault && (
                      <div style={{ position: 'absolute', top: '-10px', right: '16px', background: 'var(--gradient-brand)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.75rem', borderRadius: '999px', letterSpacing: '0.05em' }}>
                        ACTIVE
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', wordBreak: 'break-all', lineHeight: 1.2 }}>
                          {res.name} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{res.version}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                          {(res.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(res.createdAt).toLocaleDateString()}
                        </div>
                        {res.targetRole && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', marginTop: '0.4rem', fontWeight: 600 }}>
                            🎯 {res.targetRole}
                          </div>
                        )}
                        {res.notes && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {res.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {res.skills && res.skills.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Extracted Skills:</span> {res.skills.slice(0, 4).join(', ')}{res.skills.length > 4 ? '...' : ''}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => openEditModal(res)}
                        style={{ flex: 1, minWidth: '40%', padding: '0.6rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        Edit
                      </button>
                      {!res.isDefault && (
                        <button onClick={() => setAsDefault(res._id)} style={{ flex: 1, minWidth: '40%', padding: '0.6rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-brand-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                          Set Active
                        </button>
                      )}
                      <button onClick={() => deleteResume(res._id)} style={{ padding: '0.6rem 1rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        Trash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Edit Modal */}
      {editingResume && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid var(--color-border)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Resume Metadata</h2>
              <button onClick={() => setEditingResume(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.5rem' }}>✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Resume Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Version Label</label>
                <input type="text" className="form-input" value={editForm.version} onChange={e => setEditForm({ ...editForm, version: e.target.value })} placeholder="e.g. v2.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input type="text" className="form-input" value={editForm.targetRole} onChange={e => setEditForm({ ...editForm, targetRole: e.target.value })} placeholder="e.g. Data Analyst" />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea className="form-input" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows="3" placeholder="Notes for this version..." />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingResume(null)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Resume;