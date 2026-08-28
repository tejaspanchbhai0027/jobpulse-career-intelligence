import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Hide landing-style nav links on auth/dashboard pages
  const isAuthPage = ['/login', '/register', '/dashboard'].some(p => location.pathname.startsWith(p))

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const linkHover = {
    onMouseEnter: e => {
      e.currentTarget.style.color = 'var(--color-text-primary)'
      e.currentTarget.style.background = 'var(--color-surface-raised)'
    },
    onMouseLeave: e => {
      e.currentTarget.style.color = 'var(--color-text-secondary)'
      e.currentTarget.style.background = 'transparent'
    },
  }

  const linkStyle = {
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '0.4rem 0.85rem',
    borderRadius: '8px',
    transition: 'var(--transition)',
    display: 'inline-block',
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        padding: '0 2rem',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(10,10,15,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      {/* Logo */}
      <Link
        to={isAuthenticated ? '/dashboard' : '/'}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'var(--gradient-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800, fontSize: '1.25rem',
          color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
        }}>
          Job<span className="gradient-text">Pulse</span>
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isAuthenticated ? (
          /* ── Authenticated state ── */
          <>
            <Link to="/dashboard" className="hidden sm:inline-block" style={linkStyle} {...linkHover}>Dashboard</Link>
            <Link to="/intelligence" className="hidden sm:inline-block" style={linkStyle} {...linkHover}>Intelligence <span style={{fontSize: '0.65rem', background:'var(--color-brand)', color:'#fff', padding:'2px 4px', borderRadius:'4px', marginLeft:'4px'}}>BETA</span></Link>
            <div className="hidden sm:block" style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 0.25rem' }} />
            {/* User avatar + name */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '999px',
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: '#fff',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                ...linkStyle,
                background: 'none',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              Sign out
            </button>
          </>
        ) : (
          /* ── Guest state ── */
          <>
            {!isAuthPage && (
              <div className="hidden md:flex items-center">
                <a href="#features" style={linkStyle} {...linkHover}>Features</a>
                <a href="#how-it-works" style={linkStyle} {...linkHover}>How it works</a>
                <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 0.25rem' }} />
              </div>
            )}
            <Link to="/login" style={linkStyle} {...linkHover}>Sign in</Link>
            <Link
              to="/register"
              className="btn-primary"
              style={{ textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1.25rem', display: 'inline-block' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
