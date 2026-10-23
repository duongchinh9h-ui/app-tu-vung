import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Volume2,
  Brain,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDeckStore } from '../store/deckStore'
import { speakText } from '../lib/tts'
import { calculateSM2, type SM2Rating } from '../lib/sm2'
import { repository } from '../db'
import { Button } from '../components/common/Button'
import type { Card, CardProgress } from '../types'
import { cn } from '../lib/utils'

export const LearnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, activeCards, loadDeck } = useDeckStore()

  const [cardsToStudy, setCardsToStudy] = useState<Card[]>([])
  const [progressMap, setProgressMap] = useState<Map<string, CardProgress>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [studyOnlyDue, setStudyOnlyDue] = useState(false)

  // Tracking stats in current session
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  // Load progress and filter cards
  useEffect(() => {
    async function loadData() {
      if (!id || activeCards.length === 0) return

      const progresses = await repository.progress.getByDeckId(id)
      const pMap = new Map(progresses.map((p) => [p.cardId, p]))
      setProgressMap(pMap)

      const now = Date.now()
      const dueCards = activeCards.filter((c) => {
        const p = pMap.get(c.id)
        return !p || p.dueDate <= now
      })

      if (studyOnlyDue && dueCards.length > 0) {
        setCardsToStudy(dueCards)
      } else {
        setCardsToStudy(activeCards)
      }
      setCurrentIndex(0)
      setShowAnswer(false)
      setIsCompleted(false)
    }

    loadData()
  }, [id, activeCards, studyOnlyDue])

  const currentCard = cardsToStudy[currentIndex]
  const currentProgress = currentCard
    ? progressMap.get(currentCard.id) || {
        cardId: currentCard.id,
        deckId: id,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: Date.now(),
        lapses: 0,
        lastReviewed: null,
      }
    : null

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (!showAnswer) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          setShowAnswer(true)
        }
      } else {
        if (e.key === '1') {
          e.preventDefault()
          handleRate(1)
        } else if (e.key === '2') {
          e.preventDefault()
          handleRate(3)
        } else if (e.key === '3') {
          e.preventDefault()
          handleRate(4)
        } else if (e.key === '4') {
          e.preventDefault()
          handleRate(5)
        }
      }

      if (e.key.toLowerCase() === 'v' && currentCard && activeDeck) {
        speakText(currentCard.term, activeDeck.termLang)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAnswer, currentCard, activeDeck])

  const handleRate = async (rating: SM2Rating) => {
    if (!currentCard || !currentProgress || !activeDeck) return

    // Update SM-2 calculation
    const updated = calculateSM2(currentProgress, rating, Date.now())
    const newProgress: CardProgress = {
      cardId: currentCard.id,
      deckId: activeDeck.id,
      ...updated,
    }

    await repository.progress.save(newProgress)
    setProgressMap((prev) => new Map(prev).set(currentCard.id, newProgress))

    // Update session stats
    setSessionStats((prev) => {
      if (rating === 1) return { ...prev, again: prev.again + 1 }
      if (rating === 3) return { ...prev, hard: prev.hard + 1 }
      if (rating === 4) return { ...prev, good: prev.good + 1 }
      return { ...prev, easy: prev.easy + 1 }
    })

    // Next card or finish
    if (currentIndex < cardsToStudy.length - 1) {
      setCurrentIndex((i) => i + 1)
      setShowAnswer(false)
    } else {
      setIsCompleted(true)
      // Trigger celebrate confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        })
      } catch {
        // ignore if not supported
      }

      // Record study session
      const correctCount =
        sessionStats.good + sessionStats.easy + (rating >= 4 ? 1 : 0)
      await repository.sessions.record({
        deckId: activeDeck.id,
        mode: 'learn',
        date: Date.now(),
        correct: correctCount,
        total: cardsToStudy.length,
      })
      await repository.decks.recordStudy(activeDeck.id)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setIsCompleted(false)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
  }

  if (!activeDeck || cardsToStudy.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
          <Brain className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Không có thẻ cần ôn
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {studyOnlyDue
              ? 'Tất cả các thẻ trong bộ đã hoàn thành theo lịch trình hôm nay!'
              : 'Bộ thẻ này hiện chưa có thuật ngữ nào để học.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {studyOnlyDue && (
              <Button size="sm" variant="outline" onClick={() => setStudyOnlyDue(false)}>
                Ôn toàn bộ thẻ
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(id ? `/deck/${id}` : '/')}>
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / cardsToStudy.length) * 100)

  // Estimated next review intervals according to SM-2 formula preview
  const previewIntervals = {
    again: '< 1 ngày',
    hard: `${Math.max(1, currentProgress?.interval || 1)} ngày`,
    good: `${Math.round(((currentProgress?.interval || 1) * (currentProgress?.easeFactor || 2.5)) || 3)} ngày`,
    easy: `${Math.round(((currentProgress?.interval || 1) * ((currentProgress?.easeFactor || 2.5) + 0.15)) + 4)} ngày`,
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Exit button, Deck Title, Progress Bar, Due Filter */}
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
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                Thẻ {currentIndex + 1} / {cardsToStudy.length}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400 truncate max-w-[150px]">
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

          {/* Toggle between All vs Due only */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStudyOnlyDue(!studyOnlyDue)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer',
                studyOnlyDue
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              {studyOnlyDue ? 'Chỉ thẻ đến hạn' : 'Tất cả thẻ'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        {isCompleted ? (
          /* Completion Summary */
          <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
              Tuyệt vời! Hoàn thành phiên học!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
              Thuật toán SM-2 đã cập nhật lịch ôn tập tối ưu cho toàn bộ {cardsToStudy.length} thẻ.
            </p>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                <span className="block text-lg font-black text-rose-600 dark:text-rose-400">
                  {sessionStats.again}
                </span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                  Học lại
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <span className="block text-lg font-black text-amber-600 dark:text-amber-400">
                  {sessionStats.hard}
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  Khó
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                <span className="block text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {sessionStats.good}
                </span>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                  Tốt
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {sessionStats.easy}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Rất dễ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleRestart}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Ôn lại
              </Button>
              <Button size="md" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                Về bộ thẻ
              </Button>
            </div>
          </div>
        ) : (
          /* Active Card Screen */
          <div className="w-full flex flex-col items-center max-w-2xl">
            {/* Flashcard container */}
            <div className="w-full min-h-[320px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
              {/* Card top bar */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-indigo-500">
                  Thuật ngữ
                </span>
                <button
                  onClick={() => speakText(currentCard.term, activeDeck.termLang)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Phát âm (phím V)"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Term in center */}
              <div className="text-center my-6">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                  {currentCard.term}
                </h1>
                {currentCard.example && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 italic max-w-lg mx-auto">
                    "{currentCard.example}"
                  </p>
                )}
              </div>

              {/* Answer Area (revealed when showAnswer is true) */}
              {showAnswer ? (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <span className="text-xs uppercase tracking-widest font-bold text-violet-500 mb-1 block">
                    Định nghĩa & Nghĩa
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {currentCard.definition}
                  </p>
                  {currentCard.note && (
                    <div className="mt-3 inline-block px-3.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                      💡 {currentCard.note}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    Xem đáp án (Phím Cách)
                  </button>
                </div>
              )}
            </div>

            {/* 4 SM-2 Rating Buttons (shown only when answer is visible) */}
            {showAnswer && (
              <div className="w-full mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
                {/* 1: Again */}
                <button
                  onClick={() => handleRate(1)}
                  className="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-sm flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-base font-extrabold">Học lại</span>
                  <span className="text-[11px] opacity-75 font-normal">
                    {previewIntervals.again} • [Phím 1]
                  </span>
                </button>

                {/* 2: Hard */}
                <button
                  onClick={() => handleRate(3)}
                  className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold text-sm flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-base font-extrabold">Khó</span>
                  <span className="text-[11px] opacity-75 font-normal">
                    {previewIntervals.hard} • [Phím 2]
                  </span>
                </button>

                {/* 3: Good */}
                <button
                  onClick={() => handleRate(4)}
                  className="p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-base font-extrabold">Tốt</span>
                  <span className="text-[11px] opacity-75 font-normal">
                    {previewIntervals.good} • [Phím 3]
                  </span>
                </button>

                {/* 4: Easy */}
                <button
                  onClick={() => handleRate(5)}
                  className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-base font-extrabold">Rất dễ</span>
                  <span className="text-[11px] opacity-75 font-normal">
                    {previewIntervals.easy} • [Phím 4]
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
