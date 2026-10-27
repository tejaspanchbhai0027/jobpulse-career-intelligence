import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(form.email, form.password)
      
      // Navigate to correct portal based on role
      if (data.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard', { replace: true })
      } else if (data.user?.role === 'PLACEMENT_OFFICER') {
        navigate('/officer/dashboard', { replace: true })
      } else if (data.user?.role === 'MENTOR') {
        navigate('/mentor/dashboard', { replace: true })
      } else if (data.user?.role === 'INSTITUTION_ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoFill = (demoEmail) => {
    setForm({ email: demoEmail, password: 'password123' })
    if (error) setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.35rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Job<span className="gradient-text">Pulse</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.25rem' }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '1.5rem', fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--color-text-primary)',
            marginBottom: '0.35rem',
          }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Sign in to your JobPulse account
          </p>

          {/* Demo Credentials Quick-Select */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.22)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚡ Demo Logins (Click to Fill)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Pass: <code style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>password123</code>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('student@jobpulse.com')}
                style={{
                  background: form.email === 'student@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                  color: form.email === 'student@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🎓</span>
                <div>
                  <div style={{ lineHeight: 1.2 }}>Student</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 400 }}>student@jobpulse.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('admin@jobpulse.com')}
                style={{
                  background: form.email === 'admin@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                  color: form.email === 'admin@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🏫</span>
                <div>
                  <div style={{ lineHeight: 1.2 }}>Inst. Admin</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 400 }}>admin@jobpulse.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('officer@jobpulse.com')}
                style={{
                  background: form.email === 'officer@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                  color: form.email === 'officer@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>👔</span>
                <div>
                  <div style={{ lineHeight: 1.2 }}>Officer</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 400 }}>officer@jobpulse.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('mentor@jobpulse.com')}
                style={{
                  background: form.email === 'mentor@jobpulse.com' ? 'var(--color-brand-primary)' : 'var(--color-surface)',
                  color: form.email === 'mentor@jobpulse.com' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🧭</span>
                <div>
                  <div style={{ lineHeight: 1.2 }}>Mentor</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 400 }}>mentor@jobpulse.com</div>
                </div>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              padding: '0.85rem 1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-surface-overlay)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'var(--transition)',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.03em' }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: 500, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.75rem 0.75rem 1rem',
                    background: 'var(--color-surface-overlay)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'var(--transition)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                  onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: '0.85rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>

          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <Link to="/admin/login" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>
              College Admin, Officer or Mentor? <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>Command Center &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Login
