import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MentorBroadcasts = () => {
  const [institutionalNotices, setInstitutionalNotices] = useState([]);
  const [mentorBroadcasts, setMentorBroadcasts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('MY_BROADCASTS'); // 'MY_BROADCASTS' or 'INSTITUTIONAL'

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBroadcast, setNewBroadcast] = useState({
    studentId: 'ALL',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [noticesRes, notesRes, studentsRes] = await Promise.all([
        api.get('/mentor/notices'),
        api.get('/mentor/notes'),
        api.get('/mentor/students?limit=1000')
      ]);
      setInstitutionalNotices(noticesRes.data.data || []);
      setMentorBroadcasts(notesRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch broadcasts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcast.content) {
      return alert('Message content is required.');
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/mentor/notes/${editingId}`, { content: newBroadcast.content });
      } else {
        await api.post('/mentor/notes', newBroadcast);
      }
      setShowModal(false);
      setEditingId(null);
      setNewBroadcast({ studentId: 'ALL', content: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (broadcast) => {
    setEditingId(broadcast._id);
    setNewBroadcast({
      studentId: broadcast.studentId ? broadcast.studentId._id : 'ALL',
      content: broadcast.content
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await api.delete(`/mentor/notes/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete broadcast.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Broadcasts
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>
            Send messages to your students and view updates from the Placement Officer.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewBroadcast({ studentId: 'ALL', content: '' });
            setShowModal(true);
          }}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}
        >
          <span style={{ fontSize: '1.2rem' }}>📢</span> New Broadcast
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          onClick={() => setActiveTab('MY_BROADCASTS')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'MY_BROADCASTS' ? '2px solid var(--color-brand-primary)' : '2px solid transparent', color: activeTab === 'MY_BROADCASTS' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', transition: 'var(--transition)' }}
        >
          My Broadcasts
        </button>
        <button 
          onClick={() => setActiveTab('INSTITUTIONAL')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'INSTITUTIONAL' ? '2px solid var(--color-brand-primary)' : '2px solid transparent', color: activeTab === 'INSTITUTIONAL' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', transition: 'var(--transition)' }}
        >
          Institutional Updates
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading broadcasts...</div>
      ) : activeTab === 'MY_BROADCASTS' ? (
        mentorBroadcasts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>No Broadcasts Sent</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>You haven't sent any messages to your students yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mentorBroadcasts.map(broadcast => (
              <div key={broadcast._id} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      To: {broadcast.studentId ? broadcast.studentId.name : 'All Assigned Students'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {new Date(broadcast.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEditClick(broadcast)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-secondary)', transition: 'var(--transition)' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteClick(broadcast._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#ef4444', transition: 'var(--transition)' }}>
                      🗑️
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                  {broadcast.content}
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        institutionalNotices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📫</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>No Updates</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>No institutional notices found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {institutionalNotices.map(notice => (
              <div key={notice._id} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', borderLeft: notice.priority === 'HIGH' ? '4px solid #ef4444' : '4px solid var(--color-brand-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                      {notice.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <span>From: {notice.sender?.name || 'Placement Officer'}</span>
                      <span>•</span>
                      <span>{new Date(notice.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  {notice.priority === 'HIGH' && (
                    <span style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                      HIGH PRIORITY
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {notice.content}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{editingId ? 'Edit Broadcast' : 'Create Broadcast'}</h2>
            <form onSubmit={handleCreateBroadcast}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Target Audience</label>
                <select 
                  value={newBroadcast.studentId}
                  onChange={e => setNewBroadcast({ ...newBroadcast, studentId: e.target.value })}
                  disabled={!!editingId} // Prevent changing audience when editing
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', opacity: editingId ? 0.7 : 1 }}
                >
                  <option value="ALL">All My Assigned Students</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Message Content</label>
                <textarea 
                  value={newBroadcast.content}
                  onChange={e => setNewBroadcast({ ...newBroadcast, content: e.target.value })}
                  rows="5"
                  placeholder="Write your message here..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical' }}
                />
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

export default MentorBroadcasts;
