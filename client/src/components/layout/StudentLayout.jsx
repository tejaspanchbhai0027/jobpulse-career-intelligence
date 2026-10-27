import React from 'react';
import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';

const StudentLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      {/* Universal Top Header */}
      <TopHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
