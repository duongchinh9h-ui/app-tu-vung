import React, { useState } from 'react'
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  MessageSquare,
} from 'lucide-react'
import type { CardCreateInput } from '../../types/repository'
import { cn } from '../../lib/utils'

interface CardRowEditorProps {
  card: CardCreateInput
  index: number
  totalCards: number
  termRef?: (el: HTMLInputElement | null) => void
  definitionRef?: (el: HTMLInputElement | null) => void
  onChange: (index: number, field: keyof CardCreateInput, value: string) => void
  onDelete: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onKeyDownDefinition: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void
}

export const CardRowEditor: React.FC<CardRowEditorProps> = ({
  card,
  index,
  totalCards,
  termRef,
  definitionRef,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onKeyDownDefinition,
}) => {
  const [showExtras, setShowExtras] = useState(
    Boolean(card.example || card.note || card.imageUrl)
  )

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group">
      {/* Top Header of the row: Card number & Actions */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Thẻ {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Move Up */}
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Di chuyển lên"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalCards - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Di chuyển xuống"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Toggle extra fields */}
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className={cn(
              'p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors',
              showExtras
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            title="Thêm ví dụ, ghi chú hoặc ảnh"
          >
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs">
              {showExtras ? 'Thu gọn' : 'Thêm chi tiết'}
            </span>
          </button>

          {/* Delete Row */}
          <button
            type="button"
            onClick={() => onDelete(index)}
            disabled={totalCards <= 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Xóa thẻ này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-column inputs: Term & Definition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Term Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Thuật ngữ <span className="text-rose-500">*</span>
          </label>
          <input
            ref={termRef}
            type="text"
            value={card.term}
            onChange={(e) => onChange(index, 'term', e.target.value)}
            placeholder="Nhập thuật ngữ / từ vựng..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Definition Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Định nghĩa <span className="text-rose-500">*</span>
          </label>
          <input
            ref={definitionRef}
            type="text"
            value={card.definition}
            onChange={(e) => onChange(index, 'definition', e.target.value)}
            onKeyDown={(e) => onKeyDownDefinition(e, index)}
            placeholder="Nhập nghĩa của từ (Tab/Enter để tạo tiếp)..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Collapsible Extra Details: Example, Note, Image URL */}
      {showExtras && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-dashed border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ví dụ câu thực tế</span>
            </label>
            <input
              type="text"
              value={card.example || ''}
              onChange={(e) => onChange(index, 'example', e.target.value)}
              placeholder="VD: This is a great opportunity..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Ghi chú / Từ loại</span>
            </label>
            <input
              type="text"
              value={card.note || ''}
              onChange={(e) => onChange(index, 'note', e.target.value)}
              placeholder="VD: Danh từ, Động từ..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>URL hình ảnh (tùy chọn)</span>
            </label>
            <input
              type="url"
              value={card.imageUrl || ''}
              onChange={(e) => onChange(index, 'imageUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      )}
    </div>
  )
}
