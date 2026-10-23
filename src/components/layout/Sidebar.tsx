import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  BarChart2,
  Settings,
  Flame,
  Clock,
} from 'lucide-react'
import { useDeckStore } from '../../store/deckStore'
import { cn } from '../../lib/utils'

export const Sidebar: React.FC = () => {
  const { totalDueToday, decks } = useDeckStore()

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/decks', label: 'Thư viện của tôi', icon: BookOpen, count: decks.length },
    { to: '/stats', label: 'Thống kê', icon: BarChart2 },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 pr-6 border-r border-slate-200/60 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] py-6 select-none">
      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {item.count}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Due Today Mini Widget */}
      <div className="mt-auto space-y-4 pt-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-100 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Ôn tập SM-2
            </span>
            <span className="flex h-2 w-2 relative">
              {totalDueToday > 0 && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </>
              )}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalDueToday}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              thẻ đến hạn
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {totalDueToday > 0
              ? 'Các thẻ cần ôn theo chu kỳ lặp lại ngắt quãng để ghi nhớ lâu hơn.'
              : 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ cần ôn hôm nay.'}
          </p>
        </div>

        {/* Motivation pill */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <Flame className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Học đều đặn mỗi ngày để duy trì tiến độ!</span>
        </div>
      </div>
    </aside>
  )
}
