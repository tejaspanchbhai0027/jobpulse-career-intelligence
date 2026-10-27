import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const OfficerNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL',
    priority: 'NORMAL'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/officer/notices');
      setNotices(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch broadcasts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.message) {
      return alert('Title and Message are required.');
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/officer/notices/${editingId}`, newNotice);
      } else {
        await api.post('/officer/notices', newNotice);
      }
      setShowModal(false);
      setEditingId(null);
      setNewNotice({ title: '', message: '', targetAudience: 'ALL', priority: 'NORMAL' });
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (notice) => {
    setEditingId(notice._id);
    setNewNotice({
      title: notice.title,
      message: notice.message,
      targetAudience: notice.targetAudience,
      priority: notice.priority
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await api.delete(`/officer/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert('Failed to delete broadcast.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Institutional Broadcasts
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>
            Send important updates and notices to all Mentors or Students across the institution.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewNotice({ title: '', message: '', targetAudience: 'ALL', priority: 'NORMAL' });
            setShowModal(true);
          }}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}
        >
          <span style={{ fontSize: '1.2rem' }}>📢</span> New Broadcast
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading broadcasts...</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>No Broadcasts Sent</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>You haven't sent any institutional notices yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notices.map(notice => (
            <div key={notice._id} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{notice.title}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', color: 'var(--color-brand-primary)' }}>
                      Audience: {notice.targetAudience}
                    </span>
                    {notice.priority === 'HIGH' && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        Urgent
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      • {new Date(notice.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEditClick(notice)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-secondary)', transition: 'var(--transition)' }}>
                    ✏️
                  </button>
                  <button onClick={() => handleDeleteClick(notice._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#ef4444', transition: 'var(--transition)' }}>
                    🗑️
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {notice.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{editingId ? 'Edit Broadcast' : 'Create Broadcast'}</h2>
            <form onSubmit={handleCreateNotice}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Target Audience</label>
                <select 
                  value={newNotice.targetAudience}
                  onChange={e => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
                >
                  <option value="ALL">Everyone (Mentors & Students)</option>
                  <option value="STUDENTS">All Students</option>
                  <option value="MENTORS">All Mentors</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Title</label>
                <input 
                  type="text" 
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="E.g., Action Required: Update Resume"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Message Content</label>
                <textarea 
                  value={newNotice.message}
                  onChange={e => setNewNotice({ ...newNotice, message: e.target.value })}
                  rows="4"
                  placeholder="Write your broadcast message here..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Priority</label>
                <select 
                  value={newNotice.priority}
                  onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High (Urgent)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--gradient-brand)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerNotices;
