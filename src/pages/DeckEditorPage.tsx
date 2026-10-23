import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  Save,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Languages,
  FileSpreadsheet,
} from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { CardRowEditor } from '../components/deck/CardRowEditor'
import { ImportDataModal } from '../components/deck/ImportDataModal'
import { Button } from '../components/common/Button'
import { SUPPORTED_LANGUAGES } from '../types'
import type { CardCreateInput } from '../types/repository'
import type { ParsedCardItem } from '../lib/importParser'

export const DeckEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const {
    activeDeck,
    activeCards,
    loadDeck,
    createDeck,
    updateDeck,
    isSaving,
    isLoading,
  } = useDeckStore()

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [termLang, setTermLang] = useState('en-US')
  const [definitionLang, setDefinitionLang] = useState('vi-VN')
  const [cards, setCards] = useState<CardCreateInput[]>([
    { term: '', definition: '', example: '', note: '', imageUrl: '' },
    { term: '', definition: '', example: '', note: '', imageUrl: '' },
    { term: '', definition: '', example: '', note: '', imageUrl: '' },
  ])
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // References to term input elements so we can auto-focus after Tab/Enter on last definition
  const termInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleImportCards = (imported: ParsedCardItem[]) => {
    if (imported.length === 0) return

    const newCards: CardCreateInput[] = imported.map((item, idx) => ({
      term: item.term,
      definition: item.definition,
      example: '',
      note: item.note || '',
      imageUrl: '',
      order: cards.length + idx,
    }))

    // If current cards list only has empty default cards, replace with imported cards
    const isOnlyEmptyCards = cards.every(
      (c) => !c.term.trim() && !c.definition.trim()
    )

    if (isOnlyEmptyCards) {
      setCards(newCards)
    } else {
      // Keep existing non-empty cards and append imported cards
      const nonEmpty = cards.filter(
        (c) => c.term.trim().length > 0 || c.definition.trim().length > 0
      )
      setCards([...nonEmpty, ...newCards])
    }
  }

  useEffect(() => {
    if (isEditing && id) {
      loadDeck(id)
    }
  }, [isEditing, id, loadDeck])

  // Populate form if editing
  useEffect(() => {
    if (isEditing && activeDeck) {
      setTitle(activeDeck.title)
      setDescription(activeDeck.description)
      setTermLang(activeDeck.termLang)
      setDefinitionLang(activeDeck.definitionLang)

      if (activeCards.length > 0) {
        setCards(
          activeCards.map((c) => ({
            id: c.id,
            term: c.term,
            definition: c.definition,
            example: c.example || '',
            note: c.note || '',
            imageUrl: c.imageUrl || '',
            starred: c.starred,
            order: c.order,
          }))
        )
      }
    }
  }, [isEditing, activeDeck, activeCards])

  const handleCardChange = (
    index: number,
    field: keyof CardCreateInput,
    value: string
  ) => {
    setCards((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleAddCard = (focusAfterAdd = false) => {
    setCards((prev) => [
      ...prev,
      { term: '', definition: '', example: '', note: '', imageUrl: '' },
    ])

    if (focusAfterAdd) {
      setTimeout(() => {
        const nextIndex = cards.length
        termInputRefs.current[nextIndex]?.focus()
      }, 50)
    }
  }

  const handleDeleteCard = (index: number) => {
    if (cards.length <= 1) return
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setCards((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === cards.length - 1) return
    setCards((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  // Rapid card entry: When typing in definition of the last card, pressing Enter or Tab adds a new card
  const handleKeyDownDefinition = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (index === cards.length - 1) {
      if (e.key === 'Enter' || (!e.shiftKey && e.key === 'Tab')) {
        // If current card has at least term or definition filled, create next card
        if (cards[index].term.trim() || cards[index].definition.trim()) {
          e.preventDefault()
          handleAddCard(true)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)

    // Validation
    if (!title.trim()) {
      setErrorBanner('Vui lòng nhập tiêu đề cho bộ thẻ.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Filter valid cards
    const validCards = cards.filter(
      (c) => c.term.trim().length > 0 && c.definition.trim().length > 0
    )

    if (validCards.length === 0) {
      setErrorBanner('Vui lòng nhập ít nhất 1 thẻ có đủ Thuật ngữ và Định nghĩa.')
      return
    }

    try {
      if (isEditing && id) {
        await updateDeck(
          id,
          {
            title: title.trim(),
            description: description.trim(),
            termLang,
            definitionLang,
          },
          validCards
        )
        navigate(`/deck/${id}`)
      } else {
        const newDeckId = await createDeck(
          {
            title: title.trim(),
            description: description.trim(),
            termLang,
            definitionLang,
          },
          validCards
        )
        navigate(`/deck/${newDeckId}`)
      }
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu bộ thẻ.'
      )
    }
  }

  if (isEditing && isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-16 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(isEditing && id ? `/deck/${id}` : '/')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Hủy bỏ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {isEditing ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ mới'}
            </h1>
            <p className="text-xs text-slate-400">
              {cards.filter((c) => c.term && c.definition).length} / {cards.length} thẻ hợp lệ
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            className="font-semibold cursor-pointer"
            title="Nhập dữ liệu từ Word, Excel, Google Docs..."
          >
            <span className="hidden sm:inline">Nhập dữ liệu</span>
            <span className="sm:hidden">Nhập</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(isEditing && id ? `/deck/${id}` : '/')}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-md shadow-indigo-500/25 font-bold"
          >
            {isEditing ? 'Lưu thay đổi' : 'Tạo bộ thẻ'}
          </Button>
        </div>
      </div>

      {/* Error banner if any */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Deck Metadata Card: Title, Description, Languages */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Tiêu đề bộ thẻ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ví dụ: "30 Từ vựng tiếng Anh chủ đề Công việc"'
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Mô tả (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Thêm tóm tắt nội dung, đối tượng học hoặc mục tiêu..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
          />
        </div>

        {/* Language Selection: Term language & Definition language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ngôn ngữ Thuật ngữ (Phát âm TTS)</span>
            </label>
            <select
              value={termLang}
              onChange={(e) => setTermLang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              <Languages className="w-3.5 h-3.5 text-purple-500" />
              <span>Ngôn ngữ Định nghĩa / Nghĩa dịch</span>
            </label>
            <select
              value={definitionLang}
              onChange={(e) => setDefinitionLang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Shortcut hint tooltip */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Mẹo nhập nhanh:</strong> Khi đang ở ô Định nghĩa của thẻ cuối, bấm phím{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-mono shadow-xs border border-indigo-200 dark:border-indigo-800">
              Enter
            </kbd>{' '}
            hoặc{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-mono shadow-xs border border-indigo-200 dark:border-indigo-800">
              Tab
            </kbd>{' '}
            để tự động thêm thẻ tiếp theo!
          </span>
        </div>
      </div>

      {/* Cards List Header & Import Button */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Danh sách thẻ ({cards.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
          leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          className="font-semibold cursor-pointer"
        >
          + Nhập từ Word, Excel
        </Button>
      </div>

      {/* Cards Rows List */}
      <div className="space-y-4">
        {cards.map((card, idx) => (
          <CardRowEditor
            key={card.id || `card-row-${idx}`}
            card={card}
            index={idx}
            totalCards={cards.length}
            termRef={(el) => {
              termInputRefs.current[idx] = el
            }}
            onChange={handleCardChange}
            onDelete={handleDeleteCard}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onKeyDownDefinition={handleKeyDownDefinition}
          />
        ))}
      </div>

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleAddCard(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ Thêm thẻ mới (Tab/Enter ở ô cuối)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800/80 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>+ Nhập dữ liệu (Word / Excel / Docs)</span>
        </button>
      </div>

      {/* Floating Save button on mobile */}
      <div className="sm:hidden fixed bottom-16 right-4 z-40">
        <Button
          type="submit"
          size="md"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="shadow-xl shadow-indigo-600/30 font-bold"
        >
          {isEditing ? 'Lưu' : 'Tạo'}
        </Button>
      </div>

      {/* Quizlet-style Import Data Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
      />
    </form>
  )
}
