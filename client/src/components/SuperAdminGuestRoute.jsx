import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminGuestRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return null;
  
  if (isAuthenticated) {
    if (user?.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (user?.role === 'STUDENT') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  
  return children;
};

export default SuperAdminGuestRoute;
