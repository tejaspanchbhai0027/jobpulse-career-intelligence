import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      
      // Verification logic: Reject STUDENT role
      if (data.user && data.user.role === 'STUDENT') {
        await logout(); // Instantly log them out
        setError('Access denied. Student accounts cannot access the Placement Portal.');
        setLoading(false);
        return;
      }

      // Verification logic: Reject SUPER_ADMIN role
      if (data.user && data.user.role === 'SUPER_ADMIN') {
        await logout(); // Instantly log them out
        setError('Please use the Platform Owner Portal to sign in.');
        setLoading(false);
        return;
      }
      
      // Success routing
      if (data.user && data.user.role === 'MENTOR') {
        navigate('/mentor/dashboard');
      } else if (data.user && data.user.role === 'PLACEMENT_OFFICER') {
        navigate('/officer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--color-bg)',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '2.25rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: 'var(--color-text-primary)', 
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em'
          }}>
            JOBPULSE
          </h1>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            color: 'var(--color-brand-primary)', 
            marginBottom: '0.5rem',
            letterSpacing: '0.05em'
          }}>
            PLACEMENT COMMAND CENTER
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Authorized portal for College Admins, Officers & Mentors
          </p>
        </div>

        {/* Demo Credentials Quick Fill */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ⚡ Demo Logins (Click to Fill)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Pass: <code style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>password123</code>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@jobpulse.com')}
              style={{
                background: email === 'admin@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                color: email === 'admin@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.5rem 0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>🏫</span>
              Inst. Admin
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('officer@jobpulse.com')}
              style={{
                background: email === 'officer@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                color: email === 'officer@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.5rem 0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>👔</span>
              Officer
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('mentor@jobpulse.com')}
              style={{
                background: email === 'mentor@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                color: email === 'mentor@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.5rem 0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>🧭</span>
              Mentor
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: 'transparent', 
            border: '1px solid var(--color-danger)', 
            color: 'var(--color-danger)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@jobpulse.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-brand-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Password
              </label>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-brand-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: 'var(--gradient-brand)',
              color: 'var(--color-white)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Are you a student?{' '}
            <a href="/login" style={{ color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Go to Student Login &rarr;
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
