import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MentorSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navStyles = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.65rem 1.25rem',
    fontSize: '0.9rem',
    textDecoration: 'none',
    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
    background: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
    fontWeight: isActive ? 700 : 500,
    borderRight: isActive ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
    transition: 'var(--transition)'
  });

  const sectionHeaderStyle = {
    fontSize: '0.65rem', 
    fontWeight: 800, 
    color: 'var(--color-text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    padding: '1rem 1.25rem 0.4rem',
    marginTop: '0.5rem'
  };

  return (
    <aside className={`
      fixed md:sticky top-0 left-0 h-screen w-[240px] bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-40 transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}>
      <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          JOBPULSE
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎓 MENTOR PORTAL
          </span>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
            {user?.institution?.name || 'Institution'}
          </span>
        </h2>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden mt-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'var(--gradient-brand)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.1rem'
        }}>
          {user?.name?.charAt(0) || 'M'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Mentor
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.5rem 0', overflowY: 'auto' }}>
        
        <div style={{...sectionHeaderStyle, marginTop: 0}}>MAIN</div>
        <NavLink to="/mentor/dashboard" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>▣</span> Dashboard
        </NavLink>

        <div style={sectionHeaderStyle}>STUDENTS</div>
        <NavLink to="/mentor/students" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>🎓</span> My Students
        </NavLink>

        <NavLink to="/mentor/requests" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>👥</span> Requests
        </NavLink>

        <NavLink to="/mentor/interventions" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>⚠️</span> Interventions
        </NavLink>

        <div style={sectionHeaderStyle}>PLACEMENT</div>
        <NavLink to="/mentor/applications" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>📁</span> Applications
        </NavLink>

        <div style={sectionHeaderStyle}>MENTORSHIP</div>
        <NavLink to="/mentor/broadcasts" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>📢</span> Broadcasts
        </NavLink>

        <div style={sectionHeaderStyle}>REPORTING</div>
        <NavLink to="/mentor/progress" style={navStyles}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>📈</span> Progress
        </NavLink>
      </nav>

      <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => navigate('/mentor/settings')}
          style={{
            width: '100%', padding: '0.65rem', background: 'transparent',
            border: 'none', color: 'var(--color-text-secondary)',
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', transition: 'var(--transition)'
          }}
        >
          <span>⚙️</span> Settings
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.65rem',
            background: 'var(--color-surface-overlay)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'var(--transition)'
          }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default MentorSidebar;
