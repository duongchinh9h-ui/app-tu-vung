import React, { useEffect } from 'react'
import {
  Flame,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import type { Deck } from '../types'

export const StatsPage: React.FC = () => {
  const { decks, totalDueToday, loadDecks } = useDeckStore()

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  const totalCards = decks.reduce((sum: number, d: Deck) => sum + (d.cardCount || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Thống kê học tập
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi tiến độ, số thẻ đã học và chu kỳ lặp lại ngắt quãng SM-2
        </p>
      </div>

      {/* Stats summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Bộ thẻ</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {decks.length}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">bộ đang quản lý</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tổng thuật ngữ</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalCards}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">thẻ từ vựng</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Cần ôn hôm nay</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {totalDueToday}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">thẻ đến hạn SM-2</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Chuỗi ngày (Streak)</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            1 ngày
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">đang duy trì</span>
        </div>
      </div>

      {/* Feature note for Phase 3 */}
      <div className="p-6 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-center">
        <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Biểu đồ chi tiết (Recharts) sẽ được nâng cấp đầy đủ ở Giai đoạn 3
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Bao gồm biểu đồ số thẻ ôn tập theo ngày, tỷ lệ nhớ theo thuật toán SM-2, mục tiêu hằng ngày và lịch sử phiên học.
        </p>
      </div>
    </div>
  )
}
