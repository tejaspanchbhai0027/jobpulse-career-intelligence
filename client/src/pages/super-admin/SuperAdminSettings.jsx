import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Toast from '../../components/ui/Toast';

const SuperAdminSettings = () => {
  const [data, setData] = useState({
    isResendConfigured: false,
    senderEmail: '',
    provider: 'Resend'
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/super-admin/settings');
        if (res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        addToast('Error', 'Failed to load system settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addToast = (title, message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), title, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await api.post('/super-admin/settings/test-email');
      addToast('Success', res.data.message || 'Test email sent successfully', 'success');
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading configuration...</div>;

  return (
    <div style={{ width: '100%', maxWidth: '900px' }}>
      
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
          {toasts.map(toast => (
            <Toast key={toast.id} title={toast.title} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          ))}
        </div>

        {/* Clean Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Global Settings</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>Manage platform infrastructure and integrations.</p>
          </div>
        </div>

        {/* Email Configuration Card */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Email Infrastructure</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                  Transactional email delivery powered by {data.provider}.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', padding: '1.5rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Connection Status</div>
                {data.isResendConfigured ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '1rem', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                    Operational
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontSize: '1rem', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                    Not Configured
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Sender Identity</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{data.senderEmail}</div>
              </div>
            </div>

            {!data.isResendConfigured && (
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: '12px', color: '#EF4444', fontSize: '0.95rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Action Required</strong>
                  Configure <code>RESEND_API_KEY</code> in the server environment variables to enable core platform email functionality.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={handleTestEmail} 
                disabled={testing || !data.isResendConfigured} 
                className="btn-primary" 
                style={{ padding: '0.75rem 1.5rem', fontWeight: 600, borderRadius: '8px' }}
              >
                {testing ? 'Dispatching...' : 'Dispatch Test Email'}
              </button>
            </div>
          </div>
        </div>

    </div>
  );
};

export default SuperAdminSettings;
