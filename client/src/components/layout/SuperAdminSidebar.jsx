import React from 'react';
import { NavLink } from 'react-router-dom';

const SuperAdminSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const links = [
    { to: '/super-admin/dashboard', label: 'Platform Dashboard', icon: '📊' },
    { to: '/super-admin/institutions', label: 'Institutions', icon: '🏫' },
    { to: '/super-admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside className={`
      fixed md:sticky top-0 left-0 h-screen w-[260px] flex flex-col z-40 transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `} style={{
      background: '#0F1115',
      borderRight: '1px solid #2D3036',
      color: '#F5F6F8'
    }}>
      {/* Brand */}
      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', borderBottom: '1px solid #2D3036' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#3B82F6', // Clean blue for Super Admin
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>JP</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: '1.1rem',
              color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1
            }}>
              JobPulse
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Admin
            </span>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[#A7ADB8] hover:text-[#FFFFFF]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A7ADB8', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          Platform Menu
        </div>
        
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active-superadmin-link' : 'superadmin-link')}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : '#A7ADB8',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
      <div style={{ padding: '1.5rem', borderTop: '1px solid #2D3036', fontSize: '0.75rem', color: '#667085', textAlign: 'center' }}>
        JobPulse Platform MVP
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
