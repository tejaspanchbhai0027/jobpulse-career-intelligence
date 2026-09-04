import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user } = useAuth();

  const links = [
    { to: '/admin/dashboard', label: 'Placement Command Center', icon: '📊' },
    { to: '/admin/students', label: 'Students', icon: '🎓' },
    { to: '/admin/officers', label: 'Placement Officers', icon: '👨‍💼' },
    { to: '/admin/mentors', label: 'Mentors', icon: '👨‍🏫' },
    { to: '/admin/interventions', label: 'Intervention Radar', icon: '⚠️' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/institution', label: 'Institution Settings', icon: '⚙️' },
  ];

  return (
    <aside className={`
      fixed top-0 left-0 h-screen w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-40 transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}>
      {/* Brand */}
      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: '1.25rem',
            color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
          }}>
            JobPulse
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      {/* Institution Name Block */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(59,130,246,0.05)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          🏢 INSTITUTION ADMIN
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
          {user?.institution?.name || 'Loading Institution...'}
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          Menu
        </div>
        
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active-admin-link' : 'admin-link')}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              transition: 'all 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.7 }}>{link.icon}</span>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Footer Branding */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Placement Portal v1.0
      </div>
    </aside>
  );
};

export default AdminSidebar;
