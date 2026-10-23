import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Plus, BarChart2, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )
          }
        >
          <Home className="w-5 h-5" />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink
          to="/decks"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )
          }
        >
          <BookOpen className="w-5 h-5" />
          <span>Thư viện</span>
        </NavLink>

        {/* Center Floating Plus Button */}
        <NavLink
          to="/deck/new"
          className="flex items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#FDDEE6] text-[#741634] border-2 border-white dark:border-slate-900 shadow-md active:scale-95 transition-transform"
          aria-label="Tạo bộ thẻ mới"
        >
          <Plus className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/stats"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )
          }
        >
          <BarChart2 className="w-5 h-5" />
          <span>Thống kê</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span>Cài đặt</span>
        </NavLink>
      </div>
    </nav>
  )
}
