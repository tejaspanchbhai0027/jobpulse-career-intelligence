import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/dashboard/feedback?type=NOTICE');
        setNotices(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notices.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading notices...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>Notices</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Important updates and notices from your mentor and placement officer.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {notices.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📫</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>No new notices</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {notices.map(notice => (
            <div key={notice._id} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {notice.mentorId?.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{notice.mentorId?.name || 'Mentor'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{new Date(notice.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface-overlay)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>
                  NOTICE
                </div>
              </div>
              <div style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {notice.content}
              </div>
              {(notice.actionItem || notice.nextFollowUpDate) && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                  {notice.actionItem && (
                    <div style={{ marginBottom: notice.nextFollowUpDate ? '0.5rem' : 0 }}>
                      <strong style={{ color: '#3b82f6', marginRight: '8px' }}>Action Required:</strong> 
                      <span style={{ color: 'var(--color-text-primary)' }}>{notice.actionItem}</span>
                    </div>
                  )}
                  {notice.nextFollowUpDate && (
                    <div>
                      <strong style={{ color: '#3b82f6', marginRight: '8px' }}>Due by:</strong> 
                      <span style={{ color: 'var(--color-text-primary)' }}>{new Date(notice.nextFollowUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotices;
