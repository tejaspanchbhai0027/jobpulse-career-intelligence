import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLogin = () => {
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
      
      // Verification logic: STRICTLY reject non-SUPER_ADMIN
      if (data.user && data.user.role !== 'SUPER_ADMIN') {
        await logout(); // Instantly log them out
        setError('Access denied. This portal is strictly for the Platform Owner.');
        setLoading(false);
        return;
      }
      
      // Success
      navigate('/super-admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0F1115', // Darker background for platform owner vibe
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#17181C', // Dark surface
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 900, 
            color: '#FFFFFF', 
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            JOBPULSE
          </h1>
          <h2 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            color: '#A855F7', // Purple/Electric vibe for super admin
            marginBottom: '0.75rem',
            letterSpacing: '0.1em'
          }}>
            PLATFORM ADMINISTRATION
          </h2>
          <p style={{ color: '#A7ADB8', fontSize: '0.9rem' }}>
            Authorized access only.
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(220, 38, 38, 0.1)', 
            border: '1px solid #DC2626', 
            color: '#F87171', 
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A7ADB8', marginBottom: '0.5rem' }}>
              Platform Email
            </label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: '#0F1115',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#A855F7'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#A7ADB8' }}>
                Master Password
              </label>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: '#0F1115',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#A855F7'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s, opacity 0.2s',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Authenticating...' : 'Access Platform'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
