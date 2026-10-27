import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavGroup = ({ title, icon, items, defaultExpanded = false }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Check if any child is active to auto-expand
  useEffect(() => {
    if (items.some(item => location.pathname.startsWith(item.path))) {
      setExpanded(true);
    }
  }, [location.pathname, items]);

  const toggle = (e) => {
    e.preventDefault();
    setExpanded(!expanded);
  };

  const hasActiveChild = items.some(item => location.pathname.startsWith(item.path));

  return (
    <div className="mb-2">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-[15px] font-semibold border-l-4 ${
          hasActiveChild && !expanded
            ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brand-primary)] border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex justify-center items-center w-6 transition-colors duration-200 ${hasActiveChild && !expanded ? 'text-[var(--color-brand-primary)]' : ''}`}>{icon}</span>
          <span>{title}</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-1.5 ml-5 border-l-2 border-[var(--color-border)] pl-3 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-[14.5px] ${
                  isActive 
                    ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] font-bold' 
                    : 'text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brand-primary)]'
                }`}
              >
                <span className="truncate pr-2">{item.label}</span>
                {item.badge && (
                  <span className="shrink-0 bg-[var(--color-brand-primary)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NavItem = ({ path, label, icon, badge }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(path);
  return (
    <Link
      to={path}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-[15px] font-semibold mb-2 border-l-4 ${
        isActive 
          ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' 
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brand-primary)] border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 truncate">
        <span className={`flex justify-center items-center w-6 shrink-0 transition-colors duration-200 ${isActive ? 'text-[var(--color-brand-primary)]' : ''}`}>{icon}</span>
        <span className="truncate pr-2">{label}</span>
      </div>
      {badge && (
        <span className="shrink-0 bg-[var(--color-brand-primary)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const dashboardIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
  const careerIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
  const resumeIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const growthIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
  const copilotIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path><path d="M21.18 8.02c-1-2.3-2.85-4.17-5.16-5.18"></path><path d="M2 12h3l3-7 4 14 3-9 2 2h5"></path></svg>;
  const tasksIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;

  // Optional: Extract role if available in user object
  const userRole = user?.role === 'STUDENT' ? 'Student' : (user?.role || 'Student');

  return (
    <aside className="hidden lg:flex flex-col w-[300px] h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] sticky top-0 left-0 transition-all duration-300 z-40 shadow-sm shrink-0">
      {/* Header Logo */}
      <div className="h-[72px] flex items-center px-6 border-b border-[var(--color-border)]">
        <Link to="/dashboard" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-[var(--color-brand-primary)] to-[#20b2aa] flex items-center justify-center shrink-0 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M2 12h3l3-7 4 14 3-9 2 2h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-extrabold text-xl text-[var(--color-text-primary)] tracking-tight whitespace-nowrap font-['Plus_Jakarta_Sans']">
            JobPulse
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center font-bold text-xl border border-[var(--color-brand-primary)]/20 shrink-0">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="overflow-hidden flex flex-col justify-center gap-0.5">
            <div className="font-bold text-[var(--color-text-primary)] text-[15px] truncate">{user?.name || 'Student Name'}</div>
            <div className="text-[13px] text-[var(--color-text-muted)] truncate">{user?.email || 'student@example.com'}</div>
            <div className="text-[12px] font-semibold text-[var(--color-brand-primary)] truncate mt-0.5">{userRole}</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1 custom-scrollbar">
        <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-4">Main</div>
        
        <NavItem path="/dashboard" label="Dashboard" icon={dashboardIcon} />
        
        <div className="mt-6 mb-3 px-4 text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Career</div>
        <NavGroup 
          title="Career" 
          icon={careerIcon} 
          items={[
            { path: '/opportunities', label: 'Opportunities' },
            { path: '/applications', label: 'Applications' },
            { path: '/interviews', label: 'Interviews' },
            { path: '/notices', label: 'Notices' }
          ]} 
        />
        
        <div className="mt-6 mb-3 px-4 text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Resume</div>
        <NavGroup 
          title="Resume" 
          icon={resumeIcon} 
          items={[
            { path: '/resume', label: 'Resume Center' },
            { path: '/intelligence/ats', label: 'ATS & JD Match' } 
          ]} 
        />
        
        <div className="mt-6 mb-3 px-4 text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Growth</div>
        <NavGroup 
          title="Growth" 
          icon={growthIcon} 
          items={[
            { path: '/readiness', label: 'Career Readiness' },
            { path: '/intelligence/gaps', label: 'Skill Gaps' },
            { path: '/intelligence/roadmap', label: 'Career Roadmap' }
          ]} 
        />
        
        <div className="mt-6 mb-3 px-4 text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">AI & Tools</div>
        <NavItem path="/tasks" label="Tasks" icon={tasksIcon} />
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--color-border)] space-y-2">
        <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-4">Account</div>
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[15px] font-semibold border-l-4 ${
            location.pathname.startsWith('/profile')
              ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brand-primary)] border-transparent'
          }`}
        >
          <span className="flex justify-center items-center w-6 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </span>
          Profile
        </Link>
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[15px] font-semibold border-l-4 ${
            location.pathname.startsWith('/settings')
              ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brand-primary)] border-transparent'
          }`}
        >
          <span className="flex justify-center items-center w-6 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </span>
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
