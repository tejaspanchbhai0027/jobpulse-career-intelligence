import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const SuperAdminHeader = ({ setIsMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/super-admin/login');
    } catch (error) {
      console.error('Logout failed', error);
      logout();
      navigate('/super-admin/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-[70px] bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-8 z-30">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] rounded-lg transition-colors flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'right' }} className="hidden sm:block">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 600 }}>Platform Owner</div>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

const SuperAdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] relative">
      <SuperAdminSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="mt-[70px] md:ml-[260px] p-4 md:p-8 min-h-[calc(100vh-70px)] w-full md:w-[calc(100%-260px)] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
