import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // true until initial restore done

  // ── Restore session via httpOnly cookie on first mount ──────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (data.success && data.user) {
          setUser(data.user)
        }
      } catch (error) {
        // No valid cookie or session expired
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    // Clear any legacy localStorage items just in case
    localStorage.removeItem('jp_token')
    localStorage.removeItem('jp_user')
    
    fetchUser()
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    setUser(data.user)
    return data
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    return data
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      setUser(null)
    }
  }, [])

  const isAuthenticated = !!user

  const updateUser = useCallback((newData) => {
    setUser(prev => ({ ...prev, ...newData }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for convenience
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
