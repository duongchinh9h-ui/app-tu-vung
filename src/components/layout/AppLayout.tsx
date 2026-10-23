import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Fixed */}
      <Navbar />

      {/* Main Body container */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 flex-1 flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Central Content (max-w around 1100px) */}
        <main className="flex-1 min-w-0 py-6 md:pl-8 pb-24 md:pb-12 max-w-[1100px]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
