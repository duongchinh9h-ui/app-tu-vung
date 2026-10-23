import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { DeckCard } from '../components/deck/DeckCard'
import { Button } from '../components/common/Button'
import { SUPPORTED_LANGUAGES } from '../types'

export const DecksPage: React.FC = () => {
  const navigate = useNavigate()
  const { decks, loadDecks } = useDeckStore()
  const [selectedLang, setSelectedLang] = useState<string>('all')

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  const filteredDecks = decks.filter((d) => {
    if (selectedLang === 'all') return true
    return d.termLang === selectedLang
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Thư viện của tôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý và xem tất cả các bộ thẻ từ vựng đã tạo
          </p>
        </div>

        <Button
          onClick={() => navigate('/deck/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Tạo bộ thẻ mới
        </Button>
      </div>

      {/* Filter by Language bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedLang('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedLang === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Tất cả ({decks.length})
        </button>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const count = decks.filter((d) => d.termLang === lang.code).length
          if (count === 0) return null
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedLang === lang.code
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {lang.name.split(' (')[0]} ({count})
            </button>
          )
        })}
      </div>

      {/* Deck Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
            Không có bộ thẻ nào
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Chưa có bộ thẻ nào thuộc ngôn ngữ đã chọn.
          </p>
          <Button
            size="sm"
            onClick={() => setSelectedLang('all')}
          >
            Hiện tất cả
          </Button>
        </div>
      )}
    </div>
  )
}
