import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const Toggle = ({ label, description, checked, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '1rem', padding: '0.85rem 0',
    borderBottom: '1px solid var(--color-border)',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-label={`Toggle ${label}`}
      style={{
        flexShrink: 0,
        width: '44px', height: '24px',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? 'var(--color-brand-primary)' : 'var(--color-surface-overlay)',
        position: 'relative',
        transition: 'background 0.2s ease',
        boxShadow: checked ? '0 0 0 3px rgba(99,102,241,0.2)' : 'inset 0 0 0 1px var(--color-border)',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '22px' : '3px',
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  </div>
)

const SettingsModal = ({ isOpen, onClose, user, onSave }) => {
  const [days,               setDays]               = useState(7)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [deadlineReminders,  setDeadlineReminders]  = useState(true)
  const [interviewReminders, setInterviewReminders] = useState(true)
  const [resumeText,         setResumeText]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (isOpen && user) {
      setDays(user.followUpWindowDays || 7)
      setEmailNotifications(user.emailNotifications !== false) // default true
      setDeadlineReminders(user.deadlineReminders   !== false)
      setInterviewReminders(user.interviewReminders !== false)
      setResumeText(user.resumeText || '')
    }
    setError('')
  }, [isOpen, user])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      await onSave({ followUpWindowDays: days, emailNotifications, deadlineReminders, interviewReminders, resumeText })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', animation: 'fade-in 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.1rem' }}>
              ⚙️ Settings
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Configure reminders and notifications
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ padding: '0.7rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Follow-Up Window */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Follow-Up Window
            </label>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Flag applications in "Applied" status after this many days with no activity.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range" min="1" max="30" value={days}
                onChange={e => setDays(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--color-brand-primary)', cursor: 'pointer' }}
                aria-label="Follow-up window days"
              />
              <div style={{
                minWidth: '52px', height: '40px',
                background: 'var(--gradient-brand)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1rem', color: '#fff',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              }}>
                {days}d
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
              <span>1 day</span><span>~1 week</span><span>2 weeks</span><span>1 month</span>
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
              {[3, 5, 7, 14, 21].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    background: days === d ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-overlay)',
                    border: `1px solid ${days === d ? 'rgba(99,102,241,0.6)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    color: days === d ? '#a5b4fc' : 'var(--color-text-secondary)',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  {d === 7 ? '7d (default)' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Notification toggles */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notifications
            </div>
            <Toggle
              label="Email Reminders"
              description="Receive follow-up reminder emails when applications go stale."
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <Toggle
              label="Deadline Alerts"
              description="Get notified when application deadlines are approaching (3 days, 1 day, today)."
              checked={deadlineReminders}
              onChange={setDeadlineReminders}
            />
            <Toggle
              label="Interview Reminders"
              description="Receive a reminder before upcoming scheduled interviews."
              checked={interviewReminders}
              onChange={setInterviewReminders}
            />
          </div>

          {/* AI Resume Match Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📄 My Resume (For AI Match)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              Paste your master resume text here. JobPulse AI will use this to generate Match Scores and missing keywords against Job Descriptions.
            </p>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={6}
              style={{
                width: '100%', padding: '0.85rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '10px',
                color: 'var(--color-text-primary)', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', transition: 'var(--transition)'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Info box */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}>
            <strong style={{ color: '#67e8f9' }}>How it works:</strong> The daily cron job checks all your "Applied" applications. Any that haven't been updated in <strong style={{ color: 'var(--color-text-primary)' }}>{days} day{days !== 1 ? 's' : ''}</strong> will be flagged with ⚡ and you'll receive an email reminder (if enabled).
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.1rem' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={loading}
              style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem', opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Saving…
                </>
              ) : '✓ Save Settings'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}

export default SettingsModal
