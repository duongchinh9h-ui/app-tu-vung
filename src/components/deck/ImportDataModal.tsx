import React, { useState, useMemo, useEffect, useRef } from 'react'
import { X, FileSpreadsheet, AlertCircle } from 'lucide-react'
import {
  parseImportText,
  type TermDelimiterType,
  type CardDelimiterType,
  type ParsedCardItem,
} from '../../lib/importParser'
import { Button } from '../common/Button'
import { cn } from '../../lib/utils'

interface ImportDataModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (cards: ParsedCardItem[]) => void
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [rawText, setRawText] = useState('')
  const [termDelimiterType, setTermDelimiterType] =
    useState<TermDelimiterType>('tab')
  const [customTermDelimiter, setCustomTermDelimiter] = useState('-')
  const [cardDelimiterType, setCardDelimiterType] =
    useState<CardDelimiterType>('newline')
  const [customCardDelimiter, setCustomCardDelimiter] = useState(';')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle Tab key inside textarea to insert a literal Tab character
  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current || e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const nextVal = value.substring(0, start) + '\t' + value.substring(end)
      setRawText(nextVal)

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = start + 1
          textarea.focus()
        }
      })
    }
  }

  // Helper to insert separator text at cursor
  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setRawText((prev) => prev + textToInsert)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const nextVal = value.substring(0, start) + textToInsert + value.substring(end)
    setRawText(nextVal)
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length
      textarea.focus()
    })
  }

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Realtime parse
  const parsedCards = useMemo(() => {
    return parseImportText(rawText, {
      termDelimiterType,
      customTermDelimiter,
      cardDelimiterType,
      customCardDelimiter,
    })
  }, [
    rawText,
    termDelimiterType,
    customTermDelimiter,
    cardDelimiterType,
    customCardDelimiter,
  ])

  if (!isOpen) return null

  const handleConfirmImport = () => {
    if (parsedCards.length === 0) return
    onImport(parsedCards)
    setRawText('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="pr-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Nhập dữ liệu.</span>
              <span className="font-normal text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Chép và dán dữ liệu ở đây (từ Word, Excel, Google Docs, v.v.)
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Main Paste Textarea with Quick Insert Toolbar */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gõ hoặc dán nội dung (phím <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">Tab</kbd> sẽ chèn khoảng cách trực tiếp):
              </span>

              {/* Quick Delimiter Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => insertAtCursor('\t')}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Chèn ký tự Tab (khoảng cách giữa từ và định nghĩa)"
                >
                  <span>⇥ Chèn Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertAtCursor(': ')}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Chèn dấu hai chấm (:)"
                >
                  <span>: Chèn :</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertAtCursor(', ')}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Chèn dấu phẩy (,)"
                >
                  <span>, Chèn ,</span>
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={7}
              autoFocus
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onKeyDown={handleKeyDownTextarea}
              style={{ tabSize: 4, MozTabSize: 4 }}
              placeholder={`Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2\nTừ 3\tĐịnh nghĩa 3`}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-300 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          {/* Delimiter Selection: 2 Columns like Quizlet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            {/* Column 1: Giữa thuật ngữ và định nghĩa */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Giữa thuật ngữ và định nghĩa
              </label>

              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {/* Tab */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="termDelimiter"
                    value="tab"
                    checked={termDelimiterType === 'tab'}
                    onChange={() => setTermDelimiterType('tab')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tab</span>
                </label>

                {/* Colon */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="termDelimiter"
                    value="colon"
                    checked={termDelimiterType === 'colon'}
                    onChange={() => setTermDelimiterType('colon')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Dấu hai chấm (:)</span>
                </label>

                {/* Comma */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="termDelimiter"
                    value="comma"
                    checked={termDelimiterType === 'comma'}
                    onChange={() => setTermDelimiterType('comma')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Phẩy (,)</span>
                </label>

                {/* Custom */}
                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="termDelimiter"
                      value="custom"
                      checked={termDelimiterType === 'custom'}
                      onChange={() => setTermDelimiterType('custom')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tùy chỉnh</span>
                  </label>

                  <input
                    type="text"
                    value={customTermDelimiter}
                    disabled={termDelimiterType !== 'custom'}
                    onChange={(e) => setCustomTermDelimiter(e.target.value)}
                    placeholder="-, :, |"
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-xs font-mono w-24 border transition-all',
                      termDelimiterType === 'custom'
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Giữa các thẻ */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Giữa các thẻ
              </label>

              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {/* Newline */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="cardDelimiter"
                    value="newline"
                    checked={cardDelimiterType === 'newline'}
                    onChange={() => setCardDelimiterType('newline')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Dòng mới</span>
                </label>

                {/* Semicolon */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="cardDelimiter"
                    value="semicolon"
                    checked={cardDelimiterType === 'semicolon'}
                    onChange={() => setCardDelimiterType('semicolon')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Chấm phẩy</span>
                </label>

                {/* Custom */}
                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="cardDelimiter"
                      value="custom"
                      checked={cardDelimiterType === 'custom'}
                      onChange={() => setCardDelimiterType('custom')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tùy chỉnh</span>
                  </label>

                  <input
                    type="text"
                    value={customCardDelimiter}
                    disabled={cardDelimiterType !== 'custom'}
                    onChange={(e) => setCustomCardDelimiter(e.target.value)}
                    placeholder="///"
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-xs font-mono w-24 border transition-all',
                      cardDelimiterType === 'custom'
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Xem trước</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  {parsedCards.length} thẻ
                </span>
              </h4>
            </div>

            {parsedCards.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Không có nội dung để xem trước
              </p>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                {parsedCards.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs items-center hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="col-span-1 text-slate-400 font-mono font-medium">
                      #{idx + 1}
                    </span>
                    <span className="col-span-5 font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.term || <span className="text-rose-400 italic font-normal">(Trống)</span>}
                    </span>
                    <span className="col-span-6 text-slate-600 dark:text-slate-300 truncate">
                      {item.definition || (
                        <span className="text-amber-500 italic flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>(Chưa có định nghĩa)</span>
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs text-slate-500 hidden sm:block">
            {parsedCards.length > 0
              ? `Sẽ thêm ${parsedCards.length} thẻ mới vào danh sách soạn thảo.`
              : 'Dán văn bản có phân cách để nhập nhanh hàng loạt thẻ.'}
          </p>

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              className="cursor-pointer"
            >
              Hủy nhập
            </Button>

            <Button
              type="button"
              size="md"
              disabled={parsedCards.length === 0}
              onClick={handleConfirmImport}
              className="shadow-md shadow-indigo-600/25 font-bold cursor-pointer"
            >
              Nhập {parsedCards.length > 0 ? `(${parsedCards.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
