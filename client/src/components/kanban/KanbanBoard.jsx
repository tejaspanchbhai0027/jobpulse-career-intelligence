import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import ApplicationCard from './ApplicationCard'

export const STATUSES = [
  { id: 'Wishlist',   label: 'Wishlist',   color: 'var(--color-wishlist)', icon: '⭐' },
  { id: 'Applied',    label: 'Applied',    color: 'var(--color-applied)', icon: '📤' },
  { id: 'Assessment', label: 'Assessment', color: 'var(--color-assessment)', icon: '📝' },
  { id: 'Interview',  label: 'Interview',  color: 'var(--color-interview)', icon: '🎙️' },
  { id: 'Offer',      label: 'Offer',      color: 'var(--color-offer)', icon: '🎉' },
  { id: 'Rejected',   label: 'Rejected',   color: 'var(--color-rejected)', icon: '💔' },
]

const KanbanBoard = ({ applications, onUpdateApplication, onEdit, onDelete, onAddCard, placementDrives = [], onRegisterDrive }) => {
  const [activeMobileStage, setActiveMobileStage] = useState('Applied')

  return (
    <div className="w-full px-2 sm:px-6 pb-6">
      {/* Mobile Stage Selector */}
      <div className="md:hidden mb-4">
        <select
          value={activeMobileStage}
          onChange={(e) => setActiveMobileStage(e.target.value)}
          className="w-full p-3 bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-bold outline-none"
        >
          {STATUSES.map(status => (
            <option key={status.id} value={status.id}>
              {status.icon} {status.label} ({applications.filter(a => a.status === status.id).length})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATUSES.map(status => (
          <div key={status.id} className={`${activeMobileStage === status.id ? 'block' : 'hidden'} md:block`}>
            <KanbanColumn
              status={status}
              applications={applications.filter(a => a.status === status.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddCard={onAddCard}
              onUpdateApplication={onUpdateApplication}
              placementDrives={status.id === 'Wishlist' ? placementDrives.filter(d => !d.isRegistered) : []}
              onRegisterDrive={onRegisterDrive}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
