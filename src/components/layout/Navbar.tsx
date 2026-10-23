import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  Search,
  Plus,
  Sun,
  Moon,
  X,
  Sparkles,
} from 'lucide-react'
import { useDeckStore } from '../../store/deckStore'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../common/Button'

export const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery } = useDeckStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#741634] dark:text-[#FDDEE6] group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDDEE6] text-[#741634] border border-[#FBC1D1] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              LKHcards
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#FDDEE6] text-[#741634] border border-[#FBC1D1] uppercase tracking-wider">
                Pro
              </span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 -mt-0.5 font-medium hidden sm:inline">
              Học ngoại ngữ thông minh
            </span>
          </div>
        </Link>

        {/* Center: Search input (desktop & tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm bộ thẻ, từ vựng..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search toggle button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Mở tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            aria-label="Đổi giao diện sáng/tối"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Create Button */}
          <Button
            size="sm"
            onClick={() => navigate('/deck/new')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-semibold shadow-md shadow-indigo-500/20"
          >
            <span className="hidden sm:inline">Tạo bộ thẻ</span>
            <span className="sm:hidden">Tạo</span>
          </Button>

          {/* Avatar Profile Mock */}
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm select-none"
            title="Tài khoản LKHcards"
          >
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Mobile search collapsible bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm bộ thẻ, từ vựng..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-indigo-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
