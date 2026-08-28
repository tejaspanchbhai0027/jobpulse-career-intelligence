import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const VARIANTS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)',  color: '#6ee7b7', icon: '✅' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',   color: '#fca5a5', icon: '❌' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.4)',  color: '#a5b4fc', icon: 'ℹ️' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', color: '#fcd34d', icon: '⚡' },
}

const Toast = ({ toasts, onDismiss }) => {
  return createPortal(
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '1.25rem',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}

const ToastItem = ({ toast, onDismiss }) => {
  const timerRef = useRef(null)
  const v = VARIANTS[toast.type] || VARIANTS.info

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration || 4500)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      style={{
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.9rem 1.1rem',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        maxWidth: '360px',
        width: 'max-content',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        animation: 'slide-up 0.25s ease',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>{v.icon}</span>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: v.color, marginBottom: '0.15rem' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '0.8rem',
          padding: '0', lineHeight: 1, flexShrink: 0,
          marginTop: '0.1rem',
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default Toast
