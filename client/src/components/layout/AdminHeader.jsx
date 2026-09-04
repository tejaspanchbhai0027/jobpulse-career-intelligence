import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from "../../api/axios";

const AdminHeader = ({ setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [institutionName, setInstitutionName] = useState('Loading...');

  useEffect(() => {
    // Fetch institution name once
    const fetchInstitution = async () => {
      try {
        const { data } = await api.get('/institution/me');
        if (data.success && data.data) {
          setInstitutionName(data.data.name);
        } else {
          setInstitutionName('Unknown Institution');
        }
      } catch (err) {
        setInstitutionName('Unknown Institution');
      }
    };
    fetchInstitution();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  // Dynamically set page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/students')) return 'Students';
    if (path.includes('/interventions')) return 'Intervention Radar';
    if (path.includes('/employers')) return 'Employer Intelligence';
    if (path.includes('/intelligence')) return 'Career Intelligence';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/institution')) return 'Institution Settings';
    if (path.includes('/team')) return 'Team Management';
    return 'Placement Command Center';
  };

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-[70px] bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-8 z-20">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] rounded-lg transition-colors flex-shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <h1 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] truncate">
          {getPageTitle()}
        </h1>
        <div className="hidden md:block w-[1px] h-[24px] bg-[var(--color-border)] flex-shrink-0" />
        <span className="hidden md:inline-block text-[0.9rem] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-overlay)] px-3 py-1 rounded-full border border-[var(--color-border)] truncate max-w-[200px]">
          {institutionName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            borderRadius: '50%',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {user?.name || 'Admin'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {user?.role === 'INSTITUTION_ADMIN' 
                ? 'Institution Admin' 
                : user?.role === 'MENTOR' 
                  ? 'Mentor' 
                  : 'Placement Officer'}
            </div>
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            boxShadow: 'var(--shadow-card)'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            padding: '0.4rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
