import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../../context/AuthContext';

const SuperAdminHeader = ({ setIsMobileMenuOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Dynamic title based on route
  const getPageTitle = () => {
    if (location.pathname.includes('/institutions')) {
      return 'Super Admin > Institutions';
    }
    if (location.pathname.includes('/settings')) {
      return 'Super Admin > Settings';
    }
    return 'Platform Dashboard';
  };

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-[70px] bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 z-30">
      <div className="flex items-center gap-3">
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] rounded-lg transition-colors flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="hidden md:inline-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </span>
          {getPageTitle()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user?.name?.substring(0, 2).toUpperCase() || 'JP'}
          </div>
          <div style={{ textAlign: 'left' }} className="hidden sm:block">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Platform Owner</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
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
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
