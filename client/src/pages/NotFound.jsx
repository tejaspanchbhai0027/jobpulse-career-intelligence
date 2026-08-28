import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: '6rem', fontWeight: 900, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
        404
      </div>
      <h1 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--color-text-primary)',
        marginBottom: '0.75rem',
        position: 'relative', zIndex: 1,
      }}>
        Page not found
      </h1>
      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '1rem',
        marginBottom: '2rem',
        maxWidth: '380px',
        lineHeight: 1.6,
        position: 'relative', zIndex: 1,
      }}>
        Looks like this page got rejected before the interview. Let's get you back on track.
      </p>
      <Link to="/" className="btn-primary" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
        ← Back to Home
      </Link>
    </div>
  )
}

export default NotFound
