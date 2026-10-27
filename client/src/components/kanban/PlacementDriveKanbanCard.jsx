import React from 'react'

const PlacementDriveKanbanCard = ({ drive, onRegister, columnColor = 'var(--color-wishlist)' }) => {
  const cardStyle = {
    padding: '0.9rem 1rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    transition: 'var(--transition)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '0.6rem',
  }

  const d = new Date(drive.driveDate)
  const isExpired = new Date(drive.registrationEndDate) < new Date()

  return (
    <div
      className="app-card"
      style={cardStyle}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = columnColor + '66'
        e.currentTarget.style.boxShadow   = `0 4px 16px rgba(0,0,0,0.25)`
        e.currentTarget.style.transform    = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow   = 'none'
        e.currentTarget.style.transform    = 'translateY(0)'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '1rem', right: '1rem', height: '2px', background: columnColor, borderRadius: '0 0 3px 3px', opacity: 0.6 }} />

      <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {drive.company}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {drive.title}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{
            padding: '0.15rem 0.4rem',
            background: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            DRIVE
          </div>
          {/* Removed the buggy status dropdown for unregistered drives */}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          📍 {drive.workMode}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          📅 {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      
      {drive.isRegistered ? (
        <div style={{ 
          marginTop: '0.75rem', width: '100%', padding: '0.5rem', textAlign: 'center', 
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', 
          borderRadius: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 
        }}>
          ✅ Applied via Drive
        </div>
      ) : isExpired ? (
        <div style={{ 
          marginTop: '0.75rem', width: '100%', padding: '0.5rem', textAlign: 'center', 
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '6px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 
        }}>
          Registration Closed
        </div>
      ) : drive.applicationUrl ? (
        <a 
          href={drive.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'block', marginTop: '0.75rem', width: '100%', padding: '0.5rem', textAlign: 'center', 
            background: 'var(--gradient-brand)', border: 'none', textDecoration: 'none',
            borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', transition: 'var(--transition)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Apply Externally ↗
        </a>
      ) : (
        <button 
          onClick={() => onRegister(drive._id)}
          style={{ 
            marginTop: '0.75rem', width: '100%', padding: '0.5rem', textAlign: 'center', 
            background: 'var(--color-brand-primary)', border: 'none', 
            borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', transition: 'var(--transition)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-brand-primary-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-brand-primary)'}
        >
          Apply Now
        </button>
      )}
    </div>
  )
}

export default PlacementDriveKanbanCard
