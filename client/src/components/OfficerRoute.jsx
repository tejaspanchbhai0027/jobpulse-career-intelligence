import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OfficerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'PLACEMENT_OFFICER') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default OfficerRoute;
