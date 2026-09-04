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

  if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
        {toasts.map(toast => (
          <Toast key={toast.id} title={toast.title} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>System Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Configure global platform behavior.</p>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Email Service</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
            JobPulse uses Resend as its central transactional email provider.
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Provider</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{data.provider}</div>
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Status</div>
              {data.isResendConfigured ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                  Connected
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                  Not Configured
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sender Email</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{data.senderEmail}</div>
            </div>
          </div>

          {!data.isResendConfigured && (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', color: '#EF4444', fontSize: '0.9rem', marginBottom: '2rem' }}>
              <strong>Action Required:</strong> Configure <code>RESEND_API_KEY</code> in the server environment variables to enable email functionality.
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Features</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><span style={{ color: '#10B981', marginRight: '0.5rem' }}>✓</span>Password Reset</li>
              <li><span style={{ color: '#10B981', marginRight: '0.5rem' }}>✓</span>Email Verification</li>
              <li><span style={{ color: '#10B981', marginRight: '0.5rem' }}>✓</span>Account Invitations</li>
              <li><span style={{ color: '#10B981', marginRight: '0.5rem' }}>✓</span>Welcome Emails</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <button 
              onClick={handleTestEmail} 
              disabled={testing || !data.isResendConfigured} 
              className="btn-primary" 
              style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}
            >
              {testing ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SuperAdminSettings;
