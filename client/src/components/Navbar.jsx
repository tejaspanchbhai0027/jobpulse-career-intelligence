import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { theme, toggleTheme } = useTheme()

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
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(10,10,15,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem'
      }}>
        {/* Left: Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(20,255,236,0.3)',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: '1.25rem',
            color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
            whiteSpace: 'nowrap'
          }}>
            Job<span className="gradient-text">Pulse</span>
          </span>
        </Link>

        {/* Center: Navigation */}
        {isAuthenticated && (
          <div className="hidden lg:flex items-center justify-center gap-1" style={{ flex: '1 1 auto', overflow: 'hidden' }}>
            <Link to="/applications" style={linkStyle} {...linkHover}>Applications</Link>
            <Link to="/interviews" style={linkStyle} {...linkHover}>Interviews</Link>
            <Link to="/resume" style={linkStyle} {...linkHover}>Resume</Link>
            <Link to="/tasks" style={linkStyle} {...linkHover}>Tasks</Link>
            <Link to="/opportunities" style={linkStyle} {...linkHover}>Opportunities</Link>
            <Link to="/placement-drives" style={linkStyle} {...linkHover}>Drives</Link>
            <Link to="/readiness" style={linkStyle} {...linkHover}>Readiness</Link>
            <Link to="/settings" style={linkStyle} {...linkHover}>Settings</Link>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', flexShrink: 0, justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
          
          {isAuthenticated ? (
            /* ── Authenticated state ── */
            <>
            
            {/* Notification Bell */}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                position: 'relative'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {/* Optional unread badge can go here */}
              <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', background: 'var(--color-brand-primary)', borderRadius: '50%', border: '2px solid var(--color-surface)' }}></span>
            </button>

              <div className="hidden sm:block" style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 0.25rem', flexShrink: 0 }} />
              {/* User avatar + name */}
              <button
                onClick={() => navigate('/settings')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline whitespace-nowrap" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name?.split(' ')[0]}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="whitespace-nowrap"
                style={{
                  ...linkStyle,
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  borderRadius: '999px',
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
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
      </div>
    </nav>
  )
}

export default Navbar
