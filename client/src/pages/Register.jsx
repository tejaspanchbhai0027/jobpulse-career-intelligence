import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', confirm: '', 
    institutionCode: '', institutionId: '', placementOfficerId: '', mentorId: '' 
  })
  
  const [institutionName, setInstitutionName] = useState('')
  const [officers, setOfficers] = useState([])
  const [mentors, setMentors] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  // Cascading resets
  useEffect(() => {
    setForm(prev => ({ ...prev, placementOfficerId: '', mentorId: '' }))
    setOfficers([])
    setMentors([])
  }, [form.institutionCode])

  useEffect(() => {
    setForm(prev => ({ ...prev, mentorId: '' }))
    setMentors([])
    if (form.placementOfficerId) {
      fetchMentors(form.placementOfficerId)
    }
  }, [form.placementOfficerId])

  const fetchPlacementOfficers = async (instId) => {
    try {
      const { data } = await api.get(`/auth/institutions/${instId}/placement-officers`)
      setOfficers(data.data || [])
    } catch (err) {
      setError('Failed to load placement officers')
    }
  }

  const fetchMentors = async (poId) => {
    try {
      const { data } = await api.get(`/auth/placement-officers/${poId}/mentors`)
      setMentors(data.data || [])
    } catch (err) {
      setError('Failed to load mentors')
    }
  }

  const handleNextStep1 = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setStep(2)
    setError('')
  }

  const validateInstitution = async (e) => {
    e.preventDefault()
    if (!form.institutionCode) return setError('Please enter an institution code')
    
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/auth/institutions/validate?code=${form.institutionCode}`)
      if (data.success && data.data) {
        setInstitutionName(data.data.name)
        setForm(prev => ({ ...prev, institutionId: data.data._id }))
        await fetchPlacementOfficers(data.data._id)
        setStep(3)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Institution Code.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep3 = (e) => {
    e.preventDefault()
    if (!form.placementOfficerId) return setError('Please select a Placement Officer')
    setStep(4)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.mentorId) return setError('Please select a Mentor')
    
    setLoading(true)
    setError('')
    try {
      // Registration successful, log them in via context
      await register(form.name.trim(), form.email, form.password, form.institutionId, form.placementOfficerId, form.mentorId)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipInstitution = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Register with null hierarchy
      await register(form.name.trim(), form.email, form.password, null, null, null)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const getStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Too short', color: '#ef4444', width: '25%' }
    if (pwd.length < 8) return { label: 'Weak', color: '#f59e0b', width: '40%' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: '#06b6d4', width: '65%' }
    return { label: 'Strong', color: '#10b981', width: '100%' }
  }
  const strength = getStrength(form.password)

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    color: 'var(--color-text-primary)', fontSize: '0.95rem', outline: 'none',
    transition: 'var(--transition)', boxSizing: 'border-box',
  }
  const onFocus = e => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }
  const onBlur  = e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '6rem 1.5rem 2rem', position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
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

        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.6rem', fontWeight: 800,
              letterSpacing: '-0.025em', color: 'var(--color-text-primary)', margin: 0
            }}>
              Create Account
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>Step {step} of 4</span>
          </div>
          
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {step === 1 && "Basic information to get started."}
            {step === 2 && "Connect to your institution."}
            {step === 3 && `Connected to: ${institutionName}`}
            {step === 4 && "Final step: Select your mentor."}
          </p>

          {error && (
            <div style={{
              padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px',
              color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNextStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>FULL NAME</label>
                <input id="register-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Tejas Patil" required autoComplete="name" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>EMAIL ADDRESS</label>
                <input id="register-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input id="register-password" type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required autoComplete="new-password" style={{ ...inputStyle, paddingRight: '2.75rem' }} onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
                {strength && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '99px', transition: 'all 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>CONFIRM PASSWORD</label>
                <input id="register-confirm" type={showPass ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" required autoComplete="new-password" style={{ ...inputStyle, borderColor: form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.5)' : 'var(--color-border)' }} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '0.95rem', marginTop: '0.5rem' }}>Next: Connect Institution →</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={validateInstitution} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>INSTITUTION CODE</label>
                <input id="institution-code" type="text" name="institutionCode" value={form.institutionCode} onChange={handleChange} placeholder="e.g. JP-ABC-2026" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStep(1)} style={{ width: '30%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.875rem', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Validating...' : 'Next →'}
                </button>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={handleSkipInstitution} 
                  disabled={loading}
                  style={{ width: '100%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-brand-primary)', color: 'var(--color-brand-primary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Registering...' : 'Skip & Register as Independent Student'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNextStep3} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>PLACEMENT OFFICER</label>
                <select name="placementOfficerId" value={form.placementOfficerId} onChange={handleChange} required style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                  <option value="" disabled>Select Placement Officer</option>
                  {officers.map(off => (
                    <option key={off._id} value={off._id}>{off.name}</option>
                  ))}
                </select>
                {officers.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem' }}>No Placement Officers found for this institution.</p>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStep(2)} style={{ width: '30%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.875rem' }}>Next →</button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>MENTOR</label>
                <select name="mentorId" value={form.mentorId} onChange={handleChange} required style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                  <option value="" disabled>Select your Mentor</option>
                  {mentors.map(men => (
                    <option key={men._id} value={men._id}>{men.name}</option>
                  ))}
                </select>
                {mentors.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.5rem' }}>No mentors available for this Placement Officer.</p>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setStep(3)} style={{ width: '30%', padding: '0.875rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.875rem', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
