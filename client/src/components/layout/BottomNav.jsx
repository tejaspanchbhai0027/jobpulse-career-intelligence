import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const BottomNav = () => {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  // Only show bottom nav for authenticated students
  if (!isAuthenticated || user?.role !== 'STUDENT') {
    return null
  }

  // Hide on auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => location.pathname.startsWith(p))
  if (isAuthPage) return null

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      path: '/applications', // mapped to dashboard#board
      label: 'Board',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      )
    },
    {
      path: '/intelligence',
      label: 'Intelligence',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      path: '/settings',
      label: 'Profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    }
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          let isActive = false;
          if (item.path === '/applications') {
            isActive = location.pathname === '/dashboard' && location.hash === '#board'
          } else if (item.path === '/dashboard') {
             isActive = location.pathname === '/dashboard' && location.hash !== '#board'
          } else {
             isActive = location.pathname.startsWith(item.path)
          }

          const targetPath = item.path === '/applications' ? '/dashboard#board' : item.path

          return (
            <Link
              key={item.label}
              to={targetPath}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
