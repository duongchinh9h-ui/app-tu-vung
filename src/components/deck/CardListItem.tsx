import React from 'react'
import { Volume2, Star } from 'lucide-react'
import type { Card } from '../../types'
import { speakText } from '../../lib/tts'
import { cn } from '../../lib/utils'

interface CardListItemProps {
  card: Card
  termLang: string
  index: number
  onToggleStar: (cardId: string) => void
}

export const CardListItem: React.FC<CardListItemProps> = ({
  card,
  termLang,
  index,
  onToggleStar,
}) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    speakText(card.term, termLang)
  }

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleStar(card.id)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all duration-150 gap-3 group">
      {/* Index & Content */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-5 text-right shrink-0">
          {index + 1}
        </span>

        {/* Term & Definition columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 flex-1 min-w-0">
          {/* Term column */}
          <div className="min-w-0">
            <span className="font-bold text-slate-900 dark:text-white text-base break-words">
              {card.term}
            </span>
            {card.example && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic break-words">
                "{card.example}"
              </p>
            )}
          </div>

          {/* Definition column */}
          <div className="min-w-0">
            <span className="text-slate-700 dark:text-slate-200 text-sm sm:text-base break-words">
              {card.definition}
            </span>
            {card.note && (
              <span className="block text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                {card.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons: Speak & Star */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        <button
          onClick={handleSpeak}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Phát âm"
          aria-label="Phát âm thuật ngữ"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleStar}
          className={cn(
            'p-2 rounded-xl transition-colors cursor-pointer',
            card.starred
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
          title="Đánh dấu sao"
          aria-label="Đánh dấu sao"
        >
          <Star className={cn('w-4 h-4', card.starred ? 'fill-amber-400' : '')} />
        </button>
      </div>
    </div>
  )
}
