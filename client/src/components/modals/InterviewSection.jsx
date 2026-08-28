import { useState } from 'react'
import useAI from '../../hooks/useAI'

const TYPES    = ['Video', 'Phone', 'Technical', 'HR', 'Behavioral', 'On-site', 'Other']
const RESULTS  = ['Scheduled', 'Passed', 'Rejected', 'Rescheduled', 'Pending']

const RESULT_COLORS = {
  Scheduled:   { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.4)',  text: '#a5b4fc' },
  Passed:      { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.4)',  text: '#6ee7b7' },
  Rejected:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   text: '#fca5a5' },
  Rescheduled: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  text: '#fcd34d' },
  Pending:     { bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.4)', text: '#d1d5db' },
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.8rem',
  background: 'var(--color-surface-overlay)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const formatDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Interview row card ────────────────────────────────────────────────────────
const InterviewCard = ({ interview, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const colors = RESULT_COLORS[interview.result] || RESULT_COLORS.Pending
  const isUpcoming = interview.result === 'Scheduled' || interview.result === 'Rescheduled'

  return (
    <div style={{
      padding: '0.75rem 0.9rem',
      background: isUpcoming ? 'rgba(99,102,241,0.05)' : 'var(--color-surface-overlay)',
      border: `1px solid ${isUpcoming ? 'rgba(99,102,241,0.2)' : 'var(--color-border)'}`,
      borderRadius: '10px',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Round {interview.round} — {interview.interviewType}
            </span>
            <span style={{
              padding: '1px 8px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: colors.text,
            }}>
              {interview.result}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.15rem' }}>
            📅 {formatDate(interview.scheduledAt)}
          </div>
          {interview.interviewerName && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              👤 {interview.interviewerName}{interview.interviewerEmail ? ` · ${interview.interviewerEmail}` : ''}
            </div>
          )}
          {interview.meetingUrl && (
            <a
              href={interview.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.78rem', color: 'var(--color-brand-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}
            >
              🔗 Join Meeting ↗
            </a>
          )}
          {interview.notes && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
              "{interview.notes}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(interview)}
            style={{
              padding: '0.3rem 0.6rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
            title="Edit interview"
          >
            ✎
          </button>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => onDelete(interview._id)} style={{ padding: '0.3rem 0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Yes</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0.3rem 0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }} title="Delete interview">✕</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add/Edit Interview form ───────────────────────────────────────────────────
const InterviewForm = ({ existing, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(() => existing ? {
    round:            existing.round || 1,
    interviewType:    existing.interviewType || 'Video',
    scheduledAt:      existing.scheduledAt ? new Date(existing.scheduledAt).toISOString().slice(0, 16) : '',
    interviewerName:  existing.interviewerName  || '',
    interviewerEmail: existing.interviewerEmail || '',
    meetingUrl:       existing.meetingUrl || '',
    notes:            existing.notes || '',
    result:           existing.result || 'Scheduled',
  } : {
    round: 1, interviewType: 'Video', scheduledAt: '', interviewerName: '',
    interviewerEmail: '', meetingUrl: '', notes: '', result: 'Scheduled',
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const { summarizeNotes, loading: aiLoading } = useAI()

  return (
    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '0.9rem', marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginBottom: '0.75rem' }}>
        {existing ? 'Edit Interview' : '+ Schedule Interview'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div>
          <label style={labelStyle}>Round</label>
          <input type="number" min="1" value={form.round} onChange={e => set('round', parseInt(e.target.value) || 1)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={form.interviewType} onChange={e => set('interviewType', e.target.value)} style={inputStyle}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Date & Time *</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Interviewer Name</label>
          <input type="text" value={form.interviewerName} onChange={e => set('interviewerName', e.target.value)} placeholder="e.g. Jane Smith" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Interviewer Email</label>
          <input type="email" value={form.interviewerEmail} onChange={e => set('interviewerEmail', e.target.value)} placeholder="jane@company.com" style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Meeting URL</label>
          <input type="url" value={form.meetingUrl} onChange={e => set('meetingUrl', e.target.value)} placeholder="https://meet.google.com/..." style={inputStyle} />
        </div>
        {existing && (
          <div>
            <label style={labelStyle}>Result</label>
            <select value={form.result} onChange={e => set('result', e.target.value)} style={inputStyle}>
              {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
            Notes
            <button
              type="button"
              disabled={aiLoading || !form.notes}
              onClick={async () => {
                if (!form.notes) return;
                try {
                  const data = await summarizeNotes(form.notes);
                  set('notes', data.summary + (data.nextAction && data.nextAction !== 'None' ? `\n\nNext Action: ${data.nextAction}` : ''));
                } catch (e) {}
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-accent)', fontSize: '0.75rem', fontWeight: 700, cursor: (aiLoading || !form.notes) ? 'not-allowed' : 'pointer' }}
            >
              ✨ Summarize
            </button>
          </label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any notes about this interview…" style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button onClick={onCancel} type="button" style={{ padding: '0.45rem 0.9rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
        <button
          onClick={() => form.scheduledAt && onSave(form)}
          disabled={saving || !form.scheduledAt}
          type="button"
          style={{ padding: '0.45rem 0.9rem', background: 'var(--gradient-brand)', border: 'none', borderRadius: '8px', color: '#fff', cursor: form.scheduledAt && !saving ? 'pointer' : 'not-allowed', fontSize: '0.82rem', fontWeight: 700, opacity: form.scheduledAt ? 1 : 0.6 }}
        >
          {saving ? 'Saving…' : existing ? 'Save Changes' : 'Schedule'}
        </button>
      </div>
    </div>
  )
}

// ── Main InterviewSection ─────────────────────────────────────────────────────
const InterviewSection = ({ interviews, loading, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving]       = useState(false)

  const handleCreate = async (formData) => {
    setSaving(true)
    try {
      await onCreate(formData)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id, formData) => {
    setSaving(true)
    try {
      await onUpdate(id, formData)
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🎙️ Interviews {interviews.length > 0 && <span style={{ color: 'var(--color-brand-primary)' }}>({interviews.length})</span>}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            type="button"
            style={{ padding: '0.3rem 0.7rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: 'var(--color-brand-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            + Add Interview
          </button>
        )}
      </div>

      {showForm && !editingId && (
        <InterviewForm onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {loading && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>Loading interviews…</div>}

      {!loading && interviews.length === 0 && !showForm && (
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', padding: '0.5rem 0', fontStyle: 'italic' }}>
          No interviews scheduled yet.
        </div>
      )}

      {interviews.map(iv =>
        editingId === iv._id ? (
          <InterviewForm
            key={iv._id}
            existing={iv}
            onSave={(data) => handleUpdate(iv._id, data)}
            onCancel={() => setEditingId(null)}
            saving={saving}
          />
        ) : (
          <InterviewCard
            key={iv._id}
            interview={iv}
            onEdit={() => setEditingId(iv._id)}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  )
}

export default InterviewSection
