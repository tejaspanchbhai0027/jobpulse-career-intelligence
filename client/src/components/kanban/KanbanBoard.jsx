import KanbanColumn from './KanbanColumn'
import ApplicationCard from './ApplicationCard'

export const STATUSES = [
  { id: 'Wishlist',   label: 'Wishlist',   color: '#6366f1', icon: '⭐' },
  { id: 'Applied',    label: 'Applied',    color: '#06b6d4', icon: '📤' },
  { id: 'Assessment', label: 'Assessment', color: '#f59e0b', icon: '📝' },
  { id: 'Interview',  label: 'Interview',  color: '#8b5cf6', icon: '🎙️' },
  { id: 'Offer',      label: 'Offer',      color: '#10b981', icon: '🎉' },
  { id: 'Rejected',   label: 'Rejected',   color: '#ef4444', icon: '💔' },
]

const KanbanBoard = ({ applications, onUpdateApplication, onEdit, onDelete, onAddCard }) => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3"
      style={{
        gap: '1rem',
        padding: '0 1.5rem 1.5rem',
        width: '100%',
      }}
    >
      {STATUSES.map(status => (
        <KanbanColumn
          key={status.id}
          status={status}
          applications={applications.filter(a => a.status === status.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddCard={onAddCard}
          onUpdateApplication={onUpdateApplication}
        />
      ))}
    </div>
  )
}

export default KanbanBoard
