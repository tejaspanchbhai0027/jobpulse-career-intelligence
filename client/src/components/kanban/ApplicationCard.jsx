import { useState } from 'react'
import { calculateApplicationScore } from '../../utils/scoreCalculator'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now   = new Date()
  const days  = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 14)  return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Compute deadline badge info
const getDeadlineInfo = (closingDate) => {
  if (!closingDate) return null
  const now      = new Date()
  now.setHours(0, 0, 0, 0)
  const deadline = new Date(closingDate)
  deadline.setHours(0, 0, 0, 0)
  const diff = Math.round((deadline - now) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return { label: 'Closed',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.35)'   }
  if (diff === 0) return { label: 'Closes today',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)'  }
  if (diff <= 3)  return { label: `${diff}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)'  }
  return           { label: `${diff}d left`,        color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' }
}

const TYPE_COLORS = {
  'Full-time':  { text: '#a5b4fc', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)'  },
  'Internship': { text: '#67e8f9', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)'   },
  'Part-time':  { text: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  'Contract':   { text: '#c4b5fd', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)'  },
}

const ApplicationCard = ({ app, onEdit, onDelete, onUpdateApplication, columnColor = '#6366f1' }) => {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleStatusChange = (e) => {
    onUpdateApplication(app._id, { status: e.target.value })
  }

  const togglePriority = (e) => {
    e.stopPropagation()
    onUpdateApplication(app._id, { isPriority: !app.isPriority })
  }

  const deadline   = getDeadlineInfo(app.closingDate)
  const typeColors = TYPE_COLORS[app.type] || TYPE_COLORS['Full-time']
  const intelligence = calculateApplicationScore(app)

  const cardStyle = {
    padding: '0.9rem 1rem',
    background: app.isGhosted
      ? 'rgba(107,114,128,0.06)'
      : app.isPriority ? 'rgba(251,191,36,0.04)' : 'var(--color-surface)',
    border: app.isGhosted
      ? '1px solid rgba(107,114,128,0.25)'
      : app.isPriority ? '1px solid rgba(251,191,36,0.25)' : '1px solid var(--color-border)',
    borderRadius: '10px',
    transition: 'var(--transition)',
    position: 'relative',
    overflow: 'hidden',
    opacity: app.isGhosted ? 0.72 : 1,
  }

  return (
    <div>
      <div
        className="app-card"
        style={cardStyle}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = app.isPriority ? 'rgba(251,191,36,0.5)' : columnColor + '66'
          e.currentTarget.style.boxShadow   = `0 4px 16px rgba(0,0,0,0.25)`
          e.currentTarget.style.transform    = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = app.isPriority ? 'rgba(251,191,36,0.25)' : 'var(--color-border)'
          e.currentTarget.style.boxShadow   = 'none'
          e.currentTarget.style.transform    = 'translateY(0)'
          setConfirmDelete(false)
        }}
      >
        {/* Colored top accent */}
        <div style={{ position: 'absolute', top: 0, left: '1rem', right: '1rem', height: '2px', background: columnColor, borderRadius: '0 0 3px 3px', opacity: 0.6 }} />

        {/* Header: Company + Priority star + Status Dropdown */}
        <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              {/* Priority star */}
              <button
                onClick={togglePriority}
                title={app.isPriority ? 'Unstar' : 'Star as priority'}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1,
                  color: app.isPriority ? '#fbbf24' : 'var(--color-text-muted)',
                  flexShrink: 0,
                  transition: 'var(--transition)',
                }}
              >
                {app.isPriority ? '⭐' : '☆'}
              </button>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.company}
              </div>
            </div>

            {/* Role + job URL icon + ghost-job hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.8rem', color: app.isGhosted ? 'var(--color-text-muted)' : 'var(--color-text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.role}
              </div>
              {app.jobUrl && (
                <a
                  href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title="Open job posting"
                  style={{ color: 'var(--color-brand-primary)', fontSize: '0.75rem', textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}
                >
                  ↗
                </a>
              )}
              {/* Ghost-job suspicion indicator */}
              {app.possibleGhostJob && !app.isGhosted && (
                <span
                  title="This posting shows signs of a possible ghost job — no salary listed and no response in 3+ weeks"
                  style={{ fontSize: '0.75rem', cursor: 'help', flexShrink: 0, opacity: 0.65 }}
                >
                  👻
                </span>
              )}
            </div>
          </div>

          <select
            value={app.status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'var(--color-surface-overlay)',
              border: `1px solid ${columnColor}55`,
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="Wishlist">⭐ Wishlist</option>
            <option value="Applied">📤 Applied</option>
            <option value="Assessment">📝 Assessment</option>
            <option value="Interview">🎙️ Interview</option>
            <option value="Offer">🎉 Offer</option>
            <option value="Rejected">💔 Rejected</option>
          </select>
        </div>

        {/* Type badge */}
        {app.type && app.type !== 'Full-time' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.5rem',
            background: typeColors.bg, border: `1px solid ${typeColors.border}`,
            borderRadius: '5px',
            fontSize: '0.68rem', fontWeight: 700, color: typeColors.text,
            marginBottom: '0.5rem',
            letterSpacing: '0.02em',
          }}>
            {app.type}
          </div>
        )}

        {/* Ghosted badge */}
        {app.isGhosted && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.18rem 0.5rem',
            background: 'rgba(107,114,128,0.12)',
            border: '1px solid rgba(107,114,128,0.3)',
            borderRadius: '6px',
            fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af',
            marginBottom: '0.5rem',
          }}>
            👻 Likely No Response
          </div>
        )}

        {/* Follow-up badge */}
        {app.needsFollowUp && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.55rem',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '6px',
            fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b',
            marginBottom: '0.5rem',
            marginLeft: app.type && app.type !== 'Full-time' ? '0.35rem' : 0,
          }}>
            ⚡ Follow-up needed
          </div>
        )}

        {/* Deadline countdown badge */}
        {deadline && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            background: deadline.bg, border: `1px solid ${deadline.border}`,
            borderRadius: '5px',
            fontSize: '0.68rem', fontWeight: 700, color: deadline.color,
            marginBottom: '0.5rem',
            marginLeft: '0.35rem',
          }}>
            ⏰ {deadline.label}
          </div>
        )}

        {/* Intelligence Score Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          padding: '0.15rem 0.5rem',
          background: `${intelligence.color}15`, border: `1px solid ${intelligence.color}40`,
          borderRadius: '5px',
          fontSize: '0.68rem', fontWeight: 700, color: intelligence.color,
          marginBottom: '0.5rem',
          marginLeft: (deadline || app.needsFollowUp || (app.type && app.type !== 'Full-time')) ? '0.35rem' : 0,
          cursor: 'help'
        }} title="JobPulse Intelligence Score">
          {intelligence.score >= 80 ? '🟢' : intelligence.score < 50 ? '🔴' : '🟡'} {intelligence.score}
        </div>

        {/* Salary */}
        {app.salary && (
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
            💰 {app.salary}
          </div>
        )}

        {/* Footer: date + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            📅 {formatDate(app.dateApplied)}
          </span>

          <div className="card-actions" style={{ display: 'flex', gap: '0.3rem' }}>
            {confirmDelete ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(app._id); setConfirmDelete(false) }}
                  style={{ padding: '0.2rem 0.5rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '5px', color: '#fca5a5', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                  style={{ padding: '0.2rem 0.5rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '5px', color: 'var(--color-text-secondary)', fontSize: '0.7rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(app) }}
                  style={{ padding: '0.25rem 0.55rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-secondary)', fontSize: '0.72rem', cursor: 'pointer', transition: 'var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-primary)'; e.currentTarget.style.color = 'var(--color-brand-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  ✎ Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                  style={{ padding: '0.25rem 0.55rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-secondary)', fontSize: '0.72rem', cursor: 'pointer', transition: 'var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#fca5a5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contact line */}
        {app.contact && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            👤 {app.contact}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationCard
