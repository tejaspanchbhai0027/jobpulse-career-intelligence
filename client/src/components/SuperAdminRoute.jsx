import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Wait for initial session fetch
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Verifying super admin session...</div>
      </div>
    );
  }

  // Not logged in at all -> redirect to Super Admin Login
  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  // Logged in but not a Super Admin -> redirect based on role
  if (user?.role !== 'SUPER_ADMIN') {
    if (user?.role === 'STUDENT') {
      return <Navigate to="/dashboard" replace />;
    } else {
      // Institution Admin or Mentor
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // Authorized
  return children;
};

export default SuperAdminRoute;
