import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useApplications from '../hooks/useApplications'
import usePlacementDrives from '../hooks/usePlacementDrives'
import { useAllInterviews } from '../hooks/useInterviews'
import KanbanBoard, { STATUSES } from '../components/kanban/KanbanBoard'
import ApplicationModal from '../components/modals/ApplicationModal'
import Toast from '../components/ui/Toast'
import api from '../api/axios'

import StudentOffersView from '../components/applications/StudentOffersView'

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1.1rem',
    background: 'var(--color-surface)',
    border: `1px solid ${color}33`,
    borderRadius: '10px',
    minWidth: '110px',
  }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: color + '20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.9rem', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '0.15rem', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  </div>
)

// ── Skeleton Card ──────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    padding: '0.9rem 1rem', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: '10px',
  }}>
    {[70, 50, 40].map((w, i) => (
      <div key={i} style={{
        height: i === 0 ? '12px' : '10px',
        width: `${w}%`,
        background: 'var(--color-surface-overlay)',
        borderRadius: '6px',
        marginBottom: i < 2 ? '0.5rem' : 0,
        animation: 'pulse-skeleton 1.5s ease-in-out infinite',
        animationDelay: `${i * 0.15}s`,
      }} />
    ))}
    <style>{`
      @keyframes pulse-skeleton {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.4; }
      }
    `}</style>
  </div>
)

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const Applications = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { applications, loading, error, createApplication, updateApplication, deleteApplication, fetchApplications } = useApplications()
  const { drives: placementDrives, registerForDrive } = usePlacementDrives('STUDENT')
  const { interviews: allInterviews } = useAllInterviews()

  const upcomingInterviews = useMemo(() => {
    const now = new Date()
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    return allInterviews
      .filter(iv => {
        const d = new Date(iv.scheduledAt)
        return d >= now && d <= in14Days && (iv.result === 'Scheduled' || iv.result === 'Rescheduled')
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 10)
  }, [allInterviews])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('Applied')
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  
  const addToast = useCallback((title, message, type = 'info', duration = 4500) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, title, message, type, duration }])
  }, [])
  
  const handleRegisterDrive = useCallback(async (driveId, targetStatus = 'Applied') => {
    const res = await registerForDrive(driveId);
    if (res && res.success) {
      if (targetStatus !== 'Applied' && res.data && res.data._id) {
         try {
           await updateApplication(res.data._id, { status: targetStatus });
         } catch (err) {
           console.error('Failed to update status after register:', err);
         }
      }
      addToast('Success', 'Registered for placement drive', 'success');
      fetchApplications();
    } else {
      addToast('Error', res?.message || 'Failed to register', 'error');
    }
  }, [registerForDrive, updateApplication, fetchApplications, addToast]);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Search & filter
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter]     = useState('all')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [ghostedOnly, setGhostedOnly]   = useState(false)
  const [sortBy, setSortBy]             = useState('updated') // 'updated'|'newest'|'oldest'|'deadline'|'priority'


  // Filtered applications
  const filtered = useMemo(() => {
    let list = applications
    if (ghostedOnly) {
      list = list.filter(a => a.isGhosted)
    } else if (statusFilter === 'needs_followup') {
      list = list.filter(a => a.needsFollowUp)
    } else if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      list = list.filter(a => a.type === typeFilter)
    }
    if (priorityOnly) {
      list = list.filter(a => a.isPriority)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        (a.contact && a.contact.toLowerCase().includes(q)) ||
        (a.notes   && a.notes.toLowerCase().includes(q)) ||
        (a.jobDescription && a.jobDescription.toLowerCase().includes(q)) ||
        (a.salary && a.salary.toLowerCase().includes(q)) ||
        (a.source && a.source.toLowerCase().includes(q))
      )
    }
    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.dateApplied) - new Date(a.dateApplied)
      if (sortBy === 'oldest')   return new Date(a.dateApplied) - new Date(b.dateApplied)
      if (sortBy === 'deadline') {
        const da = a.closingDate ? new Date(a.closingDate) : Infinity
        const db = b.closingDate ? new Date(b.closingDate) : Infinity
        return da - db
      }
      if (sortBy === 'priority') return (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0)
      return new Date(b.updatedAt) - new Date(a.updatedAt) // default: recently updated
    })
    return list
  }, [applications, search, statusFilter, typeFilter, priorityOnly, ghostedOnly, sortBy])

  // Computed stats
  const stats = useMemo(() => ({
    total:     applications.length,
    applied:   applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer:     applications.filter(a => a.status === 'Offer').length,
    followUp:  applications.filter(a => a.needsFollowUp).length,
  }), [applications])

  // Handlers
  const openAddModal = (status = 'Applied') => {
    setEditingApp(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  const openEditModal = (app) => {
    setEditingApp(app)
    setModalOpen(true)
  }

  const handleSave = async (formData, id) => {
    const payload = { ...formData }
    if (!id && defaultStatus && !formData.status) {
      payload.status = defaultStatus
    }
    if (id) {
      await updateApplication(id, payload)
    } else {
      // Pre-fill status with the column it was added from
      if (!payload.status || payload.status === 'Applied') {
        payload.status = defaultStatus
      }
      await createApplication(payload)
    }
  }

  const handleRunCheck = async () => {
    setNudgeLoading(true)
    try {
      const { data } = await api.post('/nudge/run')
      addToast(
        data.totalFlagged > 0 ? 'Check Complete' : 'All caught up!',
        data.message,
        data.totalFlagged > 0 ? 'warning' : 'success'
      )
      if (data.totalFlagged > 0) fetchApplications() // refresh to show badges
    } catch (err) {
      addToast('Check Failed', err.response?.data?.message || 'Failed to run follow-up check', 'error')
    } finally {
      setNudgeLoading(false)
    }
  }

  const handleSaveFilterView = async () => {
    const name = window.prompt('Enter a name for this filter view:')
    if (!name) return
    const newState = { search, statusFilter, typeFilter, priorityOnly, ghostedOnly, sortBy }
    const newFilters = [...(user.savedFilters || []), { name, state: newState }]
    try {
      // Don't use handleSaveSettings directly here because it throws up and expects modal to catch
      await api.patch('/auth/settings', { savedFilters: newFilters })
      // Update local user context (if possible, but usually requires a hard refresh or useAuth updating).
      // For now, we rely on the fact that fetchApplications or just refreshing the page will show it, 
      // but actually we need to update the user object. Wait, useAuth might need a refresh.
      // We will reload the page to be safe if useAuth doesn't expose a refresh function,
      // or we just call window.location.reload()
      addToast('Filter Saved', `"${name}" has been saved. Refreshing...`, 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      addToast('Error', 'Failed to save filter view', 'error')
    }
  }

  const handleLoadFilterView = (e) => {
    const filterName = e.target.value
    if (filterName === '') return
    const view = user.savedFilters?.find(f => f.name === filterName)
    if (view && view.state) {
      setSearch(view.state.search || '')
      setStatusFilter(view.state.statusFilter || 'all')
      setTypeFilter(view.state.typeFilter || 'all')
      setPriorityOnly(view.state.priorityOnly || false)
      setGhostedOnly(view.state.ghostedOnly || false)
      setSortBy(view.state.sortBy || 'updated')
      addToast('Filter Loaded', `Applied view: "${filterName}"`, 'info', 2000)
    }
    e.target.value = '' // reset dropdown
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="page-container" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      padding: '36px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '24px',
        flexShrink: 0,
      }}>
        {/* Row 1: title + actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <h1 style={{
              fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              Applications
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>
              Track and manage your application pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stats.followUp > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
              }}>
                ⚡ {stats.followUp} need follow-up
              </div>
            )}
            
            <button
              onClick={() => openAddModal('Applied')}
              className="btn-primary"
              style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '999px' }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span> Add Application
            </button>
          </div>
        </div>

        {/* Row 2: Search & Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow sm:flex-grow-0 min-w-[240px]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company, role…"
              className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] text-sm outline-none transition-all duration-300 focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary-light)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] text-sm outline-none cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="needs_followup">⚡ Needs Follow-up</option>
            {STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] text-sm outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
          <button
            onClick={() => setPriorityOnly(p => !p)}
            style={{
              padding: '0.5rem 1rem',
              background: priorityOnly ? 'rgba(251,191,36,0.12)' : 'var(--color-surface)',
              border: `1px solid ${priorityOnly ? 'rgba(251,191,36,0.45)' : 'var(--color-border)'}`,
              borderRadius: '999px',
              color: priorityOnly ? '#fbbf24' : 'var(--color-text-secondary)',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            ⭐ Priority
          </button>
          <button
            onClick={() => setGhostedOnly(g => !g)}
            style={{
              padding: '0.5rem 1rem',
              background: ghostedOnly ? 'rgba(156,163,175,0.12)' : 'var(--color-surface)',
              border: `1px solid ${ghostedOnly ? 'rgba(156,163,175,0.45)' : 'var(--color-border)'}`,
              borderRadius: '999px',
              color: ghostedOnly ? '#9ca3af' : 'var(--color-text-secondary)',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            👻 Ghosted
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] text-sm outline-none cursor-pointer"
          >
            <option value="updated">↕ Recently Updated</option>
            <option value="newest">↕ Newest Applied</option>
            <option value="oldest">↕ Oldest Applied</option>
            <option value="deadline">↕ Deadline Soonest</option>
            <option value="priority">↕ Priority First</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Main Content: Kanban Board ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: '1rem', width: '100%' }}>
            {loading ? (
              /* Loading skeleton */
              <div style={{ display: 'flex', gap: '0.85rem', padding: '0 1.5rem 1.5rem', overflowX: 'auto' }}>
                {STATUSES.map(s => (
                  <div key={s.id} style={{ flexShrink: 0, width: '272px' }}>
                    <div style={{ height: '46px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', borderTop: `3px solid ${s.color}`, marginBottom: '0.6rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {[1, 2].map(i => <SkeletonCard key={i} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <KanbanBoard
                applications={filtered}
                placementDrives={placementDrives}
                onRegisterDrive={handleRegisterDrive}
                onUpdateApplication={updateApplication}
                onEdit={openEditModal}
                onDelete={deleteApplication}
                onAddCard={openAddModal}
              />
            )}
      </div>

      {/* ── Upcoming Interviews Panel ─────────────────────────────────── */}
      {upcomingInterviews.length > 0 && (
        <div style={{
          margin: '0 1.5rem 1.5rem',
          padding: '1rem 1.25rem',
          background: 'rgba(13,115,119,0.15)',
              border: '1px solid rgba(13,115,119,0.3)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                🎙️ Upcoming Interviews ({upcomingInterviews.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upcomingInterviews.map(iv => {
                  const d = new Date(iv.scheduledAt)
                  const isToday = d.toDateString() === new Date().toDateString()
                  return (
                    <div key={iv._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      background: isToday ? 'rgba(13,115,119,0.2)' : 'var(--color-surface)',
                      border: `1px solid ${isToday ? 'rgba(20,255,236,0.35)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {iv.application?.company} — {iv.application?.role}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {iv.interviewType} · Round {iv.round}
                          {iv.interviewerName ? ` · ${iv.interviewerName}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isToday ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', textAlign: 'right' }}>
                          {isToday ? '🔴 Today ' : ''}{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button
                          onClick={() => navigate(`/interview-prep/${iv._id}`)}
                          style={{
                            padding: '0.3rem 0.7rem',
                            background: 'transparent',
                            border: '1px solid var(--color-brand-primary)',
                            color: 'var(--color-brand-primary)', 
                            borderRadius: '6px',
                            fontSize: '0.75rem', fontWeight: 700,
                            cursor: 'pointer'
                          }}>
                          Prepare 🎤
                        </button>
                        {iv.meetingUrl && (
                          <a href={iv.meetingUrl} target="_blank" rel="noopener noreferrer" style={{
                            padding: '0.3rem 0.7rem',
                            background: 'var(--gradient-brand)',
                            color: '#fff', borderRadius: '6px',
                            fontSize: '0.75rem', fontWeight: 700,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                          }}>
                            Join ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Empty State (no apps at all) ─────────────────────────────────── */}
          {!loading && applications.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', padding: '2rem',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.4rem', fontWeight: 800,
                color: 'var(--color-text-primary)', marginBottom: '0.5rem',
              }}>
                Your pipeline is empty
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Add your first application to start tracking your job search
              </p>
              <button onClick={() => openAddModal('Applied')} className="btn-primary" style={{ fontSize: '0.95rem' }}>
                ＋ Add Application
              </button>
            </div>
          )}

      {/* ── Application Modal ──────────────────────────────────────────────── */}
      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingApp(null) }}
        application={editingApp}
        onSave={handleSave}
        onDelete={deleteApplication}
        defaultStatus={defaultStatus}
      />
      
      {/* ── Toast Notifications ────────────────────────────────────────────── */}
      <Toast toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  )
}

export default Applications
