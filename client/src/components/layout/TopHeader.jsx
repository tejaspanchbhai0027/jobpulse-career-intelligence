import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavLink = ({ to, label, isActive, icon }) => (
  <Link
    to={to}
    className={`relative flex items-center justify-center h-full px-4 font-bold transition-colors ${
      isActive ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
    }`}
  >
    {icon && <span className="mr-1">{icon}</span>}
    {label}
    {isActive && (
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-brand-primary)] rounded-t-md shadow-[0_-2px_10px_rgba(32,178,170,0.3)]"></span>
    )}
  </Link>
);

const ProfileDropdown = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userRole = user?.role === 'STUDENT' ? 'Student' : (user?.role || 'Student');

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-[var(--color-surface-raised)] p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-[var(--color-border)]"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center font-bold text-sm border border-[var(--color-brand-primary)]/20">
          {user?.name?.charAt(0) || 'S'}
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="text-[14px] font-bold text-[var(--color-text-primary)]">{user?.name?.split(' ')[0] || 'User'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden z-50" onClick={() => setIsOpen(false)}>
          <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="font-bold text-[16px] text-[var(--color-text-primary)] truncate">{user?.name || 'Student Name'}</div>
            <div className="text-[13px] font-bold text-[var(--color-brand-primary)] mt-1">{userRole}</div>
            <div className="text-[13px] text-[var(--color-text-muted)] truncate mt-1">{user?.email || 'student@example.com'}</div>
          </div>

          <div className="p-2">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-[14px] font-bold text-red-500 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TopHeader = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const path = location.pathname;

  return (
    <>
      <header className="h-[72px] bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40 shadow-sm w-full px-4 md:px-[36px] flex justify-center">
        <div className="w-full max-w-[1440px] h-full flex items-center">
          {/* Left: Logo */}
          <div className="flex-1 flex items-center shrink-0">
            <Link to="/dashboard" className="flex items-center gap-3 no-underline">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-[var(--color-brand-primary)] to-[#20b2aa] flex items-center justify-center shrink-0 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl text-[var(--color-text-primary)] tracking-tight whitespace-nowrap font-['Plus_Jakarta_Sans']">
                Job<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-[#20b2aa]">Pulse</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex justify-center items-center gap-4 xl:gap-6 h-full shrink-0">
            <NavLink to="/dashboard" label="Dashboard" isActive={path === '/dashboard' || path === '/'} />
            <NavLink to="/applications" label="Applications" isActive={path.startsWith('/applications')} />
            <NavLink to="/placement-updates" label="Placement Updates" isActive={path.startsWith('/placement-updates')} />
            <NavLink to="/resume" label="Resume Center" isActive={path.startsWith('/resume')} />
            <NavLink to="/readiness" label="Career Readiness" isActive={path.startsWith('/readiness')} />
            <NavLink to="/notices" label="Notices" isActive={path.startsWith('/notices')} />
            <NavLink to="/settings" label="Settings" isActive={path.startsWith('/settings')} />
          </nav>

          {/* Right: Actions & Profile */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4 shrink-0">
            <ProfileDropdown user={user} logout={logout} />

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-[72px] bg-[var(--color-bg)] flex flex-col h-screen overflow-y-auto">
          <div className="p-4 flex-1">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path === '/dashboard' || path === '/' ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Dashboard</Link>
            <Link to="/applications" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path.startsWith('/applications') ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Applications</Link>
            <Link to="/resume" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path.startsWith('/resume') ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Resume Center</Link>
            <Link to="/readiness" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path.startsWith('/readiness') ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Career Readiness</Link>
            <Link to="/notices" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path.startsWith('/notices') ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Notices</Link>
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-bold mb-2 ${path.startsWith('/settings') ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Settings</Link>
          </div>
        </div>
      )}
    </>
  );
};

export default TopHeader;
