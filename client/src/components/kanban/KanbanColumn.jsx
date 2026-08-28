import ApplicationCard from './ApplicationCard'

const KanbanColumn = ({ status, applications, onEdit, onDelete, onAddCard, onUpdateApplication }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '350px',
        maxHeight: '500px',
        width: '100%',
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 0.85rem',
        marginBottom: '0.6rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        borderTop: `3px solid ${status.color}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem' }}>{status.icon}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.01em' }}>
            {status.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Count badge */}
          <span style={{
            minWidth: '20px', height: '20px',
            background: applications.length > 0 ? status.color + '22' : 'var(--color-surface-overlay)',
            border: `1px solid ${applications.length > 0 ? status.color + '44' : 'var(--color-border)'}`,
            borderRadius: '999px',
            fontSize: '0.7rem', fontWeight: 800,
            color: applications.length > 0 ? status.color : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 0.3rem',
          }}>
            {applications.length}
          </span>
          {/* Add button */}
          <button
            onClick={() => onAddCard(status.id)}
            title={`Add to ${status.label}`}
            style={{
              width: '22px', height: '22px',
              background: 'transparent', border: 'none',
              borderRadius: '5px',
              color: 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = status.color; e.currentTarget.style.background = status.color + '22' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          padding: '0.4rem',
          borderRadius: '10px',
          background: 'transparent',
          minHeight: '80px',
          scrollbarWidth: 'thin',
        }}
      >
        {applications.map(app => (
          <ApplicationCard
            key={app._id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateApplication={onUpdateApplication}
            columnColor={status.color}
          />
        ))}

        {/* Empty state */}
        {applications.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem 1rem', gap: '0.5rem',
            color: 'var(--color-text-muted)',
          }}>
            <div style={{ fontSize: '1.5rem', opacity: 0.4 }}>{status.icon}</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center' }}>
              Click + to add
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default KanbanColumn
