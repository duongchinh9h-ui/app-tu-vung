import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Volume2,
  Star,
  Shuffle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { speakText } from '../lib/tts'
import { Button } from '../components/common/Button'
import { repository } from '../db'
import { cn } from '../lib/utils'

export const FlashcardsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, activeCards, loadDeck, toggleStarCard } = useDeckStore()

  const [cards, setCards] = useState(activeCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [showFrontFirst, setShowFrontFirst] = useState(true) // true = Term front, false = Definition front
  const [starredOnly, setStarredOnly] = useState(false)
  const [completedRound, setCompletedRound] = useState(false)

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  // Filter cards based on starredOnly
  useEffect(() => {
    let list = [...activeCards]
    if (starredOnly) {
      list = list.filter((c) => c.starred)
    }
    if (isShuffled) {
      list = list.sort(() => Math.random() - 0.5)
    }
    setCards(list)
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompletedRound(false)
  }, [activeCards, starredOnly, isShuffled])

  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const currentCard = cards[currentIndex]

  // Keyboard navigation: Space = flip, ArrowLeft = prev, ArrowRight = next, S = star, V = voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setIsFlipped((f) => !f)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key.toLowerCase() === 's' && currentCard) {
        toggleStarCard(currentCard.id)
      } else if (e.key.toLowerCase() === 'v' && currentCard && activeDeck) {
        speakText(currentCard.term, activeDeck.termLang)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cards.length, currentIndex, currentCard, activeDeck, toggleStarCard])

  const handleNext = async () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCompletedRound(true)
      // Record session
      if (activeDeck) {
        await repository.sessions.record({
          deckId: activeDeck.id,
          mode: 'flashcards',
          date: Date.now(),
          correct: cards.length,
          total: cards.length,
        })
        await repository.decks.recordStudy(activeDeck.id)
      }
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleShuffle = () => {
    setIsShuffled((prev) => !prev)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompletedRound(false)
  }

  if (!activeDeck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-slate-500 mb-4">Đang tải bộ thẻ...</p>
          <Button onClick={() => navigate('/')}>Quay lại</Button>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
          <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm font-medium">
            {starredOnly
              ? 'Không có thẻ nào được đánh dấu sao trong bộ thẻ này.'
              : 'Bộ thẻ này hiện chưa có nội dung nào để học.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {starredOnly && (
              <Button size="sm" variant="outline" onClick={() => setStarredOnly(false)}>
                Học tất cả thẻ
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100)

  const frontSide = showFrontFirst ? currentCard.term : currentCard.definition
  const backSide = showFrontFirst ? currentCard.definition : currentCard.term

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Exit button, Deck Title, Progress Bar, Actions */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Exit (X) Button */}
          <button
            onClick={() => navigate(`/deck/${activeDeck.id}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thoát chế độ học"
            aria-label="Thoát"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Progress title & counter */}
          <div className="flex-1 max-w-md mx-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentIndex + 1} / {cards.length} thẻ
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium truncate max-w-[160px]">
                {activeDeck.title}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls: Flip order, Starred only, Shuffle */}
          <div className="flex items-center gap-1">
            {/* Front mode toggle */}
            <button
              onClick={() => setShowFrontFirst(!showFrontFirst)}
              className={cn(
                'p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer',
                !showFrontFirst
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              title={showFrontFirst ? 'Mặt trước: Thuật ngữ (bấm để đổi sang Định nghĩa)' : 'Mặt trước: Định nghĩa'}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden md:inline text-xs">
                {showFrontFirst ? 'Thuật ngữ' : 'Định nghĩa'}
              </span>
            </button>

            {/* Starred filter */}
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={cn(
                'p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer',
                starredOnly
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              title="Chỉ học thẻ có sao"
            >
              <Star className={cn('w-4 h-4', starredOnly ? 'fill-amber-400' : '')} />
              <span className="hidden md:inline text-xs">Thẻ sao</span>
            </button>

            {/* Shuffle */}
            <button
              onClick={handleShuffle}
              className={cn(
                'p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer',
                isShuffled
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              title="Xáo trộn thứ tự thẻ"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden md:inline text-xs">Xáo trộn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Study Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        {completedRound ? (
          /* Finished screen */
          <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Hoàn thành vòng học!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã xem qua toàn bộ {cards.length} thẻ trong vòng học này.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleRestart}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Học lại từ đầu
              </Button>
              <Button onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                Về chi tiết bộ thẻ
              </Button>
            </div>
          </div>
        ) : (
          /* 3D Flashcard */
          <div className="w-full flex flex-col items-center">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[3/2] max-h-[460px] cursor-pointer perspective-1000 select-none"
            >
              <div
                className={cn(
                  'relative w-full h-full duration-300 transform-style-3d transition-transform rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900',
                  isFlipped ? 'rotate-y-180' : ''
                )}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden rounded-3xl bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        speakText(currentCard.term, activeDeck.termLang)
                      }}
                      className="p-3 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Phát âm (phím V)"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStarCard(currentCard.id)
                      }}
                      className={cn(
                        'p-3 rounded-2xl transition-colors',
                        currentCard.starred
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                      title="Đánh dấu sao (phím S)"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6',
                          currentCard.starred ? 'fill-amber-400' : ''
                        )}
                      />
                    </button>
                  </div>

                  <div className="my-auto text-center px-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-indigo-500 mb-2 block">
                      {showFrontFirst ? 'Thuật ngữ' : 'Định nghĩa'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {frontSide}
                    </h2>
                    {showFrontFirst && currentCard.example && (
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-4 italic">
                        "{currentCard.example}"
                      </p>
                    )}
                  </div>

                  <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Bấm vào thẻ hoặc phím Cách để xem mặt sau
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden rotate-y-180 rounded-3xl bg-indigo-50/50 dark:bg-slate-900/90 border-2 border-indigo-200/50 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        speakText(currentCard.term, activeDeck.termLang)
                      }}
                      className="p-3 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Phát âm (phím V)"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStarCard(currentCard.id)
                      }}
                      className={cn(
                        'p-3 rounded-2xl transition-colors',
                        currentCard.starred
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                      title="Đánh dấu sao (phím S)"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6',
                          currentCard.starred ? 'fill-amber-400' : ''
                        )}
                      />
                    </button>
                  </div>

                  <div className="my-auto text-center px-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-violet-500 mb-2 block">
                      {showFrontFirst ? 'Định nghĩa & Nghĩa' : 'Thuật ngữ'}
                    </span>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {backSide}
                    </p>
                    {currentCard.example && !showFrontFirst && (
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 italic">
                        "{currentCard.example}"
                      </p>
                    )}
                    {currentCard.note && (
                      <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                        💡 {currentCard.note}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Bấm vào thẻ hoặc phím Cách để quay lại mặt trước
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between w-full mt-6 px-4">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                leftIcon={<ChevronLeft className="w-5 h-5" />}
              >
                Trước
              </Button>

              <div className="text-xs text-slate-400 hidden sm:block">
                Phím tắt: [Space] Lật • [← / →] Đổi thẻ • [S] Sao • [V] Loa
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ChevronRight className="w-5 h-5" />}
              >
                {currentIndex === cards.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
