import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import InterviewSection from './InterviewSection'
import useAI from '../../hooks/useAI'
import useInterviews from '../../hooks/useInterviews'
import { calculateApplicationScore, calculateTrustSignals } from '../../utils/scoreCalculator'

const STATUSES = ['Wishlist', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected']
const TYPES    = ['Full-time', 'Internship', 'Part-time', 'Contract']
const SOURCES  = ['LinkedIn', 'Referral', 'Company Website', 'Naukri', 'Indeed', 'Other']

const TYPE_COLORS = {
  'Full-time':  { bg: 'rgba(13,115,119,0.2)', border: 'rgba(13,115,119,0.5)', text: '#14FFEC' },
  'Internship': { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.35)',  text: '#67e8f9' },
  'Part-time':  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d' },
  'Contract':   { bg: 'rgba(20,255,236,0.1)', border: 'rgba(20,255,236,0.3)', text: '#14FFEC' },
}

const initialForm = {
  company:       '',
  role:          '',
  jobUrl:        '',
  status:        'Applied',
  type:          'Full-time',
  dateApplied:   new Date().toISOString().split('T')[0],
  closingDate:   '',
  isPriority:    false,
  salary:        '',
  source:        '',
  contact:       '',
  resumeVersion: '',
  resumeId:      '',
  jobDescription:'',
  notes:         '',
  nextAction:    '',
  followUpDate:  '',
  followUpStatus:'Not Required',
  lastContactedDate: '',
  followUpNotes: '',
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  background: 'var(--color-surface-overlay)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  color: 'var(--color-text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'var(--transition)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.35rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const ApplicationModal = ({ isOpen, onClose, application, onSave, onDelete }) => {
  const isEdit = !!application
  const [viewMode, setViewMode]   = useState(false)
  const [form, setForm]           = useState(initialForm)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'interviews' | 'intelligence' | 'advisor'
  const [feedback, setFeedback] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [resumes, setResumes] = useState([])

  // AI state
  const { analyzeJD, matchResume, summarizeNotes, loading: aiLoading, error: aiError } = useAI()
  const [jdAnalysis, setJdAnalysis] = useState(null)
  const [resumeMatchData, setResumeMatchData] = useState(null)

  // Interview hook — only active when editing an existing application
  const { interviews, loading: ivLoading, createInterview, updateInterview, deleteInterview } =
    useInterviews(isEdit ? application?._id : null)

  // Sync form when modal opens/changes
  useEffect(() => {
    if (!isOpen) return

    // Fetch Resumes
    const fetchResumes = async () => {
      try {
        const res = await api.get('/resumes')
        if (res.data.success) {
          const fetchedResumes = res.data.data;
          setResumes(fetchedResumes)
          if (!application && fetchedResumes.length > 0) {
            const defaultResume = fetchedResumes.find(r => r.isDefault);
            setForm(prev => ({
              ...prev,
              resumeId: defaultResume ? defaultResume._id : fetchedResumes[0]._id
            }))
          }
        }
      } catch (err) {
        console.error('Failed to fetch resumes for modal', err)
      }
    }
    fetchResumes()

    if (application) {
      setForm({
        company:       application.company       || '',
        role:          application.role          || '',
        jobUrl:        application.jobUrl        || '',
        status:        application.status        || 'Applied',
        type:          application.type          || 'Full-time',
        dateApplied:   application.dateApplied
          ? new Date(application.dateApplied).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        closingDate:   application.closingDate
          ? new Date(application.closingDate).toISOString().split('T')[0]
          : '',
        isPriority:    application.isPriority    || false,
        salary:        application.salary        || '',
        source:        application.source        || '',
        contact:       application.contact       || '',
        resumeVersion: application.resumeVersion || '',
        resumeId:      (application.resumeId && application.resumeId._id) ? application.resumeId._id : application.resumeId || '',
        jobDescription:application.jobDescription|| '',
        notes:         application.notes         || '',
        nextAction:    application.nextAction    || '',
        followUpDate:  application.followUpDate ? new Date(application.followUpDate).toISOString().split('T')[0] : '',
        followUpStatus:application.followUpStatus|| 'Not Required',
        lastContactedDate: application.lastContactedDate ? new Date(application.lastContactedDate).toISOString().split('T')[0] : '',
        followUpNotes: application.followUpNotes || '',
      })
    } else {
      setForm({ ...initialForm, dateApplied: new Date().toISOString().split('T')[0] })
    }
    setViewMode(!!application)
    setError('')
    setActiveTab('details')
    setJdAnalysis(null)
    setResumeMatchData(null)
    // Auto-open advanced section if editing an app that has advanced fields
    if (application) {
      const hasAdvanced = application.salary || application.source || application.contact || application.resumeVersion || application.jobDescription
      setAdvancedOpen(!!hasAdvanced)
      
      // Fetch feedback specific to this application
      const fetchFeedback = async () => {
        setFeedbackLoading(true)
        try {
          const res = await api.get(`/dashboard/feedback?applicationId=${application._id}`)
          if (res.data.success) {
            setFeedback(res.data.data)
          }
        } catch (err) {
          console.error('Failed to fetch application feedback', err)
        } finally {
          setFeedbackLoading(false)
        }
      }
      fetchFeedback()
    } else {
      setAdvancedOpen(false)
      setFeedback([])
    }
  }, [application, isOpen])

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const togglePriority = () => {
    setForm(prev => ({ ...prev, isPriority: !prev.isPriority }))
  }

  const handleAnalyzeJD = async () => {
    if (!form.jobDescription) return setError('Please paste a Job Description first')
    try {
      const data = await analyzeJD(form.jobDescription)
      setJdAnalysis(data)
      setResumeMatchData(null)
    } catch (e) {} // Error handled in hook
  }

  const handleMatchResume = async () => {
    if (!form.jobDescription) return setError('Please paste a Job Description first')
    try {
      const data = await matchResume(form.jobDescription)
      setResumeMatchData(data)
      setJdAnalysis(null)
    } catch (e) {} // Error handled in hook
  }

  const handleSummarizeNotes = async () => {
    if (!form.notes) return setError('Please write some notes first to summarize')
    try {
      const data = await summarizeNotes(form.notes)
      setForm(prev => ({
        ...prev,
        notes: data.summary + (data.nextAction && data.nextAction !== 'None' ? `\n\nNext Action: ${data.nextAction}` : ''),
        // optionally update closing date or follow-up date if returned, keeping it simple for now
      }))
    } catch (e) {} // Error handled in hook
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) {
      return setError('Company and Role are required')
    }
    setLoading(true)
    setError('')
    try {
      await onSave(form, isEdit ? application._id : null)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const focusStyle = (e) => {
    e.target.style.borderColor = 'var(--color-brand-primary)'
    e.target.style.boxShadow   = '0 0 0 3px rgba(20,255,236,0.15)'
  }
  const blurStyle = (e) => {
    e.target.style.borderColor = 'var(--color-border)'
    e.target.style.boxShadow   = 'none'
  }

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[560px] flex flex-col relative"
        style={{
          animation: 'slide-up 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.25rem', fontWeight: 800,
              color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
              marginBottom: '0.15rem',
            }}>
              {isEdit ? 'Edit Application' : 'Add Application'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {isEdit ? 'Update your application details' : 'Log a new job application'}
            </p>
            {/* Tab switcher — only for edit mode */}
            {isEdit && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '0.6rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', padding: '3px', width: '100%' }}>
                {[
                  { id: 'details', label: '📋 Details' }, 
                  { id: 'followup', label: '🎯 Next Action' },
                  { id: 'interviews', label: `🎙️ Interviews${interviews.length ? ` (${interviews.length})` : ''}` },
                  { id: 'intelligence', label: '🧠 Intelligence' },
                  { id: 'advisor', label: `📝 Advisor Notes${feedback.length ? ` (${feedback.length})` : ''}` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      transition: 'var(--transition)',
                      background: activeTab === tab.id ? 'var(--gradient-brand)' : 'transparent',
                      color: activeTab === tab.id ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-surface-overlay)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              fontSize: '1rem', transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-overlay)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {(() => {
          const scoreInfo = isEdit && application ? calculateApplicationScore(application) : null
          const trustInfo = isEdit && application ? calculateTrustSignals(application) : null

          return (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '1.75rem' }}>
              <div className="flex flex-col gap-4 flex-1">
              {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Details Tab ────────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            viewMode ? (
              <div className="flex flex-col gap-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{form.company}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{form.role}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode(false)}
                    style={{
                      padding: '0.5rem 1rem', background: 'var(--color-brand-primary)',
                      color: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.85rem',
                      fontWeight: 700, border: 'none', cursor: 'pointer',
                    }}
                  >
                    ✎ Edit Details
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {form.status && (
                    <div>
                      <span style={labelStyle}>Status</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.status}</div>
                    </div>
                  )}
                  {form.type && (
                    <div>
                      <span style={labelStyle}>Type</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.type}</div>
                    </div>
                  )}
                  {form.dateApplied && (
                    <div>
                      <span style={labelStyle}>Date Applied</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{new Date(form.dateApplied).toLocaleDateString()}</div>
                    </div>
                  )}
                  {form.closingDate && (
                    <div>
                      <span style={labelStyle}>Deadline</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{new Date(form.closingDate).toLocaleDateString()}</div>
                    </div>
                  )}
                  {form.salary && (
                    <div>
                      <span style={labelStyle}>Salary / Stipend</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.salary}</div>
                    </div>
                  )}
                  {form.source && (
                    <div>
                      <span style={labelStyle}>Applied Via</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.source}</div>
                    </div>
                  )}
                  {form.contact && (
                    <div>
                      <span style={labelStyle}>Contact</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.contact}</div>
                    </div>
                  )}
                  {form.resumeId ? (
                    <div>
                      <span style={labelStyle}>Resume Used</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {resumes.find(r => r._id === form.resumeId)?.name || 'Linked Resume'} 
                        {resumes.find(r => r._id === form.resumeId)?.version && ` (${resumes.find(r => r._id === form.resumeId)?.version})`}
                      </div>
                    </div>
                  ) : form.resumeVersion ? (
                    <div>
                      <span style={labelStyle}>Resume Used</span>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{form.resumeVersion}</div>
                    </div>
                  ) : null}
                </div>

                {form.jobUrl && (
                  <div>
                    <span style={labelStyle}>Job URL</span>
                    <a href={form.jobUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--color-brand-primary)', textDecoration: 'none' }}>
                      {form.jobUrl} ↗
                    </a>
                  </div>
                )}

                {form.jobDescription && (
                  <div>
                    <span style={labelStyle}>Job Description</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap' }}>
                      {form.jobDescription}
                    </div>
                  </div>
                )}

                {form.notes && (
                  <div>
                    <span style={labelStyle}>Notes</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap' }}>
                      {form.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <>
              {/* Row 1: Company + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Company *</label>
              <input
                name="company" value={form.company} onChange={handleChange}
                placeholder="Google" required autoFocus={!isEdit}
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <input
                name="role" value={form.role} onChange={handleChange}
                placeholder="Senior Frontend Engineer" required
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Row 2: Status + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status" value={form.status} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                onFocus={focusStyle} onBlur={blurStyle}
              >
                <option value="Wishlist">⭐ Wishlist</option>
                <option value="Applied">📤 Applied</option>
                <option value="Assessment">📝 Assessment</option>
                <option value="Interview">🎙️ Interview</option>
                <option value="Offer">🎉 Offer</option>
                <option value="Rejected">💔 Rejected</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Application Type</label>
              <select
                name="type" value={form.type} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                onFocus={focusStyle} onBlur={blurStyle}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Date Applied + Application Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Date Applied</label>
              <input
                type="date" name="dateApplied" value={form.dateApplied} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Application Deadline</label>
              <input
                type="date" name="closingDate" value={form.closingDate} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Job URL + Open button */}
          <div>
            <label style={labelStyle}>Job URL</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <input
                name="jobUrl" value={form.jobUrl} onChange={handleChange}
                placeholder="https://careers.company.com/job/12345"
                style={{ ...inputStyle, flex: 1 }} onFocus={focusStyle} onBlur={blurStyle}
              />
              {form.jobUrl && (
                <a
                  href={form.jobUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '0.7rem 0.9rem',
                    background: 'var(--color-surface-overlay)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: 'var(--color-brand-primary)',
                    fontSize: '0.85rem', fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    whiteSpace: 'nowrap', transition: 'var(--transition)',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,115,119,0.2)'; e.currentTarget.style.borderColor = 'var(--color-brand-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-overlay)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
                >
                  Open ↗
                </a>
              )}
            </div>
          </div>

          {/* Priority toggle */}
          <div>
            <button
              type="button"
              onClick={togglePriority}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 1rem',
                background: form.isPriority ? 'rgba(251,191,36,0.1)' : 'var(--color-surface-overlay)',
                border: `1px solid ${form.isPriority ? 'rgba(251,191,36,0.4)' : 'var(--color-border)'}`,
                borderRadius: '10px', cursor: 'pointer',
                color: form.isPriority ? '#fbbf24' : 'var(--color-text-secondary)',
                fontSize: '0.875rem', fontWeight: 600,
                transition: 'var(--transition)', width: '100%',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{form.isPriority ? '⭐' : '☆'}</span>
              {form.isPriority ? 'Priority application (starred)' : 'Mark as priority application'}
            </button>
          </div>

          {/* ── Advanced Details collapsible ── */}
          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '0.6rem 0.9rem',
                background: 'var(--color-surface-overlay)',
                border: '1px solid var(--color-border)',
                borderRadius: advancedOpen ? '10px 10px 0 0' : '10px',
                cursor: 'pointer', color: 'var(--color-text-secondary)',
                fontSize: '0.8rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                transition: 'var(--transition)',
              }}
            >
              <span>⚙ Advanced Details</span>
              <span style={{ transition: 'transform 0.2s ease', transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
            </button>

            {advancedOpen && (
              <div style={{
                border: '1px solid var(--color-border)', borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '1rem',
                background: 'var(--color-surface-overlay)',
              }}>
                {/* Salary + Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Salary / Stipend</label>
                    <input
                      name="salary" value={form.salary} onChange={handleChange}
                      placeholder="₹8-10 LPA / $25/hr"
                      style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Applied Via</label>
                    <select
                      name="source" value={form.source} onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    >
                      <option value="">— Not specified —</option>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label style={labelStyle}>Contact / Recruiter</label>
                  <input
                    name="contact" value={form.contact} onChange={handleChange}
                    placeholder="Sarah Chen — sarah@company.com"
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>

                {/* Resume Version */}
                <div>
                  <label style={labelStyle}>Resume Used</label>
                  <select
                    name="resumeId" value={form.resumeId} onChange={handleChange}
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                  >
                    <option value="">— Select a Resume —</option>
                    {resumes.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} {r.version ? `(${r.version})` : ''} {r.isDefault ? '[Default]' : ''}
                      </option>
                    ))}
                  </select>
                  {!form.resumeId && form.resumeVersion && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Legacy Resume: {form.resumeVersion}
                    </div>
                  )}
                </div>

                {/* Job Description & AI Insights */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                    Job Description
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" onClick={handleAnalyzeJD} disabled={aiLoading} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>✨ Analyze JD</button>
                      <button type="button" onClick={handleMatchResume} disabled={aiLoading} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>✨ Resume Match</button>
                    </div>
                  </label>
                  <textarea
                    name="jobDescription" value={form.jobDescription} onChange={handleChange}
                    placeholder="Paste the full job description here to use AI insights..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />

                  {/* AI Error */}
                  {aiError && (
                    <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '0.75rem', borderRadius: '6px', marginTop: '0.75rem' }}>
                      ⚠️ {aiError}
                    </div>
                  )}

                  {/* JD Analysis Results */}
                  {jdAnalysis && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(13,115,119,0.1)', border: '1px solid rgba(13,115,119,0.3)', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14FFEC', marginBottom: '0.5rem' }}>✨ JD Analysis</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        <p><strong style={{color:'var(--color-text-secondary)'}}>Role:</strong> {jdAnalysis.role}</p>
                        <p><strong style={{color:'var(--color-text-secondary)'}}>Experience:</strong> {jdAnalysis.experience}</p>
                        <p style={{ marginTop: '0.4rem' }}><strong style={{color:'var(--color-text-secondary)'}}>Skills:</strong> {jdAnalysis.skills?.join(', ')}</p>
                        {jdAnalysis.concerns?.length > 0 && (
                          <div style={{ marginTop: '0.4rem', color: '#fca5a5' }}>
                            <strong style={{color:'var(--color-text-secondary)'}}>Concerns:</strong>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                              {jdAnalysis.concerns.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resume Match Results */}
                  {resumeMatchData && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(13,115,119,0.1)', border: '1px solid rgba(13,115,119,0.3)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14FFEC' }}>✨ Resume Match</h4>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: resumeMatchData.matchScore > 75 ? '#10b981' : resumeMatchData.matchScore > 50 ? '#f59e0b' : '#ef4444' }}>
                          {resumeMatchData.matchScore}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        <div style={{ color: '#6ee7b7' }}><strong>Strong:</strong> {resumeMatchData.strong?.join(', ')}</div>
                        <div style={{ color: '#fca5a5', marginTop: '0.4rem' }}><strong>Missing:</strong> {resumeMatchData.missing?.join(', ')}</div>
                        <div style={{ color: '#14FFEC', marginTop: '0.4rem' }}><strong>Suggested Keywords:</strong> {resumeMatchData.suggestedKeywords?.join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                    Notes
                    <button type="button" onClick={handleSummarizeNotes} disabled={aiLoading || !form.notes} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-accent)', fontSize: '0.75rem', fontWeight: 700, cursor: (aiLoading || !form.notes) ? 'not-allowed' : 'pointer' }}>✨ Summarize</button>
                  </label>
                  <textarea
                    name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Interview prep notes, salary expectations, referral details…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }}
                    onFocus={focusStyle} onBlur={blurStyle}
                  />
                </div>
              </div>
            )}
          </div>
          </>
          )
          )}
          
          {/* ── Next Action Tab ────────────────────────────────────────────── */}
          {activeTab === 'followup' && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Next Action & Follow-up</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Track what needs to happen next for this application.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={labelStyle}>Next Action</label>
                  <input
                    type="text"
                    name="nextAction"
                    value={form.nextAction}
                    onChange={handleChange}
                    placeholder="e.g. Email recruiter for update"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Follow-up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={form.followUpDate}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    name="followUpStatus"
                    value={form.followUpStatus}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="Not Required">Not Required</option>
                    <option value="Planned">Planned</option>
                    <option value="Due">Due</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>Last Contacted</label>
                  <input
                    type="date"
                    name="lastContactedDate"
                    value={form.lastContactedDate}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <label style={labelStyle}>Follow-up Notes</label>
                <textarea
                  name="followUpNotes"
                  value={form.followUpNotes}
                  onChange={handleChange}
                  placeholder="Notes about your communication..."
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* ── Interviews Tab (edit mode only) ──────────────────────────── */}
          {isEdit && activeTab === 'interviews' && (
            <div style={{ padding: '0 1.75rem 1rem' }}>
              <InterviewSection
                interviews={interviews}
                loading={ivLoading}
                onCreate={createInterview}
                onUpdate={updateInterview}
                onDelete={deleteInterview}
              />
            </div>
          )}

          {/* ── Intelligence Tab (edit mode only) ──────────────────────────── */}
          {isEdit && activeTab === 'intelligence' && scoreInfo && trustInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Application Score */}
              <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>JobPulse Score</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0' }}>Heuristic score based on historical conversions.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: scoreInfo.color }}>{scoreInfo.score}<span style={{fontSize: '1rem', color: 'var(--color-text-muted)'}}>/100</span></div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreInfo.color, marginTop: '0.3rem' }}>{scoreInfo.status}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scoreInfo.breakdown.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: item.type === 'positive' ? '#10b981' : item.type === 'negative' ? '#ef4444' : '#f59e0b' }}>
                        {item.type === 'positive' ? '✓' : item.type === 'negative' ? '✗' : 'ℹ'}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Center */}
              <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Job Posting Signals</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0' }}>Quality and trust signals for this posting.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ padding: '0.3rem 0.6rem', background: `${trustInfo.color}15`, border: `1px solid ${trustInfo.color}40`, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: trustInfo.color }}>
                      {trustInfo.verdict}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {trustInfo.signals.map((signal, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: 'var(--color-surface-overlay)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <span style={{ color: signal.type === 'positive' ? '#10b981' : signal.type === 'negative' ? '#ef4444' : '#f59e0b', fontSize: '1rem', lineHeight: 1 }}>
                        {signal.type === 'positive' ? '✓' : signal.type === 'negative' ? '⚠' : 'ℹ'}
                      </span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{signal.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Suspect a ghost job?
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!application) return;
                      const updated = { ...form, isGhosted: !application.isGhosted }
                      await onSave(updated, application._id)
                      onClose()
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: application.isGhosted ? 'var(--color-surface-overlay)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${application.isGhosted ? 'var(--color-border)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: '6px', color: application.isGhosted ? 'var(--color-text-secondary)' : '#ef4444',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {application.isGhosted ? 'Unmark Ghosted' : 'Mark as Ghosted'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ── Advisor Notes Tab (edit mode only) ──────────────────────────── */}
          {isEdit && activeTab === 'advisor' && (
            <div style={{ padding: '0 1.75rem 1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
                Feedback & Advice
              </h3>
              {feedbackLoading ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Loading feedback...</div>
              ) : feedback.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  No mentor feedback linked to this application yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedback.map(f => (
                    <div key={f._id} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{f.type}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {f.content}
                      </div>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        — {f.mentorId?.name || 'Advisor'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-up History */}
          {isEdit && (
            <div>
              <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                Follow-up history
                {application.needsFollowUp && (
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: '4px',
                    fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b',
                    textTransform: 'none', letterSpacing: 'normal',
                  }}>
                    Follow-up needed
                  </span>
                )}
              </label>
              <div style={{
                ...inputStyle,
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                cursor: 'default',
              }}>
                {application.lastFollowUpAt
                  ? `Last follow-up reminder sent: ${new Date(application.lastFollowUpAt).toLocaleDateString()}`
                  : 'No follow-up reminder sent yet'}
              </div>
            </div>
          )}

              </div>
          {/* Footer buttons */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex gap-3 justify-between items-center sticky bottom-0 bg-[var(--color-surface)] pb-safe">
            <div>
              {isEdit && !viewMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this application? This cannot be undone.")) {
                      onDelete(application._id);
                      onClose();
                    }
                  }}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.875rem', padding: '0.65rem 1.25rem',
                    color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-overlay)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                >
                  Delete Application
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button" onClick={onClose}
                className="btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.65rem 1.25rem' }}
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    fontSize: '0.875rem', padding: '0.65rem 1.5rem',
                    opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Saving…
                    </>
                  ) : isEdit ? '✓ Save Changes' : '＋ Add Application'}
                </button>
              )}
            </div>
          </div>
        </form>
          )
        })()}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}

export default ApplicationModal

