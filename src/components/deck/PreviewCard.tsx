import React, { useState, useEffect } from 'react'
import {
  Volume2,
  Star,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Card } from '../../types'
import { speakText } from '../../lib/tts'
import { cn } from '../../lib/utils'

interface PreviewCardProps {
  cards: Card[]
  termLang: string
  onToggleStar: (cardId: string) => void
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  cards,
  termLang,
  onToggleStar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showFrontFirst, setShowFrontFirst] = useState(true)

  const currentCard = cards[currentIndex]

  // Reset flip when switching cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  // Keyboard navigation: Space = flip, ArrowLeft = prev, ArrowRight = next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cards.length, currentIndex])

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
        <p className="text-slate-500">Bộ thẻ này hiện chưa có thuật ngữ nào.</p>
      </div>
    )
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(0) // loop to start
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      setCurrentIndex(cards.length - 1)
    }
  }

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    speakText(text, termLang)
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentCard) {
      onToggleStar(currentCard.id)
    }
  }

  const frontSideContent = showFrontFirst ? currentCard.term : currentCard.definition
  const backSideContent = showFrontFirst ? currentCard.definition : currentCard.term

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Top Controls: Counter & Mode Switch */}
      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-400">
            (Phím cách để lật, ←/→ để chuyển thẻ)
          </span>
        </div>

        <button
          onClick={() => setShowFrontFirst(!showFrontFirst)}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 underline font-medium cursor-pointer"
        >
          {showFrontFirst ? 'Mặt trước: Thuật ngữ' : 'Mặt trước: Định nghĩa'}
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full aspect-[3/2] min-h-[260px] sm:min-h-[320px] cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={cn(
            'relative w-full h-full duration-300 transform-style-3d transition-transform rounded-3xl shadow-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900',
            isFlipped ? 'rotate-y-180' : ''
          )}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full p-6 sm:p-8 flex flex-col justify-between backface-hidden rounded-3xl bg-white dark:bg-slate-900">
            {/* Top row in card: Audio & Star */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => handleSpeak(e, currentCard.term)}
                className="p-2.5 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Phát âm thuật ngữ"
                aria-label="Phát âm thuật ngữ"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleStarClick}
                className={cn(
                  'p-2.5 rounded-full transition-colors',
                  currentCard.starred
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                title="Đánh dấu thẻ khó"
                aria-label="Đánh dấu sao"
              >
                <Star
                  className={cn(
                    'w-5 h-5',
                    currentCard.starred ? 'fill-amber-400' : ''
                  )}
                />
              </button>
            </div>

            {/* Center Content */}
            <div className="my-auto text-center px-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-indigo-500 mb-2 block">
                {showFrontFirst ? 'Thuật ngữ' : 'Định nghĩa'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {frontSideContent}
              </h2>
              {currentCard.example && showFrontFirst && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 italic line-clamp-2">
                  "{currentCard.example}"
                </p>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Bấm để lật xem định nghĩa
              </span>
              {currentCard.note && (
                <span className="text-slate-500 font-medium">
                  {currentCard.note}
                </span>
              )}
            </div>
          </div>

          {/* BACK FACE (rotated 180deg) */}
          <div className="absolute inset-0 w-full h-full p-6 sm:p-8 flex flex-col justify-between backface-hidden rotate-y-180 rounded-3xl bg-indigo-50/50 dark:bg-slate-900/90 border-2 border-indigo-200/50 dark:border-indigo-900/40">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => handleSpeak(e, currentCard.term)}
                className="p-2.5 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Phát âm"
                aria-label="Phát âm thuật ngữ"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleStarClick}
                className={cn(
                  'p-2.5 rounded-full transition-colors',
                  currentCard.starred
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                title="Đánh dấu thẻ khó"
                aria-label="Đánh dấu sao"
              >
                <Star
                  className={cn(
                    'w-5 h-5',
                    currentCard.starred ? 'fill-amber-400' : ''
                  )}
                />
              </button>
            </div>

            {/* Center Content */}
            <div className="my-auto text-center px-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-violet-500 mb-2 block">
                {showFrontFirst ? 'Định nghĩa & Ý nghĩa' : 'Thuật ngữ'}
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {backSideContent}
              </p>
              {currentCard.example && (
                <div className="mt-3 p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Ví dụ: </span>
                  {currentCard.example}
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Bấm để quay lại mặt trước
              </span>
              {currentCard.note && (
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {currentCard.note}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between w-full mt-4 px-2">
        <button
          onClick={handlePrev}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all cursor-pointer"
          aria-label="Thẻ trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {cards.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                currentIndex === idx
                  ? 'w-6 bg-indigo-600'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              )}
              aria-label={`Chuyển đến thẻ ${idx + 1}`}
            />
          ))}
          {cards.length > 10 && (
            <span className="text-xs text-slate-400 ml-1">+{cards.length - 10}</span>
          )}
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all cursor-pointer"
          aria-label="Thẻ tiếp theo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
