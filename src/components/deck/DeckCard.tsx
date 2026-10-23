import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, ChevronRight, Languages } from 'lucide-react'
import type { Deck } from '../../types'
import { Badge } from '../common/Badge'
import { formatRelativeTime } from '../../lib/utils'

interface DeckCardProps {
  deck: Deck
}

export const DeckCard: React.FC<DeckCardProps> = ({ deck }) => {
  const isDue = (deck.dueCount || 0) > 0

  return (
    <Link
      to={`/deck/${deck.id}`}
      className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all duration-200"
    >
      <div>
        {/* Top meta tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Languages className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium uppercase">
              {deck.termLang.split('-')[0]} → {deck.definitionLang.split('-')[0]}
            </span>
          </div>

          {isDue ? (
            <Badge variant="amber" size="sm" className="font-semibold gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Cần ôn: {deck.dueCount}</span>
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm">
              Đã hoàn thành
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
          {deck.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {deck.description || 'Chưa có mô tả cho bộ thẻ này.'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>{deck.cardCount || 0} thuật ngữ</span>
        </div>

        <div className="flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium transition-colors">
          <span>{formatRelativeTime(deck.updatedAt)}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
