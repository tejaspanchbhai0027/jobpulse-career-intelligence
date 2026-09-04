import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. Wait for initial session fetch
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Verifying admin session...</div>
      </div>
    );
  }

  // 2. Not logged in -> Redirect to admin login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // 3. Logged in as student -> Block access
  if (user.role === 'STUDENT') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-danger)', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-danger)', margin: '0 0 1rem 0' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            You are logged in as a Student. This portal is strictly for authorized Placement Officers and Institution Admins.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{ 
              background: 'var(--gradient-brand)', color: 'var(--color-white)', 
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', 
              fontWeight: 600, cursor: 'pointer' 
            }}
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 4. Logged in as SUPER_ADMIN -> Redirect to super admin dashboard
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // 5. Authorized Admin (INSTITUTION_ADMIN, PLACEMENT_OFFICER, MENTOR)
  return children;
};

export default AdminRoute;
