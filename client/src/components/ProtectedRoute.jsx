import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Shows a spinner while auth state is being restored from the backend via HttpOnly cookies
const Spinner = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
  }}>
    <div style={{
      width: '44px', height: '44px',
      borderRadius: '50%',
      border: '3px solid var(--color-border)',
      borderTopColor: 'var(--color-brand-primary)',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

// Wraps any route that requires authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Enforce student role
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin/dashboard" replace />
  } else if (user.role === 'PLACEMENT_OFFICER') {
    return <Navigate to="/officer/dashboard" replace />
  } else if (user.role === 'MENTOR') {
    return <Navigate to="/mentor/dashboard" replace />
  } else if (user.role === 'INSTITUTION_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
