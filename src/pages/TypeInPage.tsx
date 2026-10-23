import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeftRight,
  Volume2,
  Settings,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDeckStore } from '../store/deckStore'
import { speakText } from '../lib/tts'
import { compareAnswers, type MatchOptions } from '../lib/stringMatch'
import { repository } from '../db'
import { Button } from '../components/common/Button'
import type { Card } from '../types'
import { cn } from '../lib/utils'

export const TypeInPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, activeCards, loadDeck } = useDeckStore()

  // Direction state: 'def_to_term' (default) or 'term_to_def'
  const [direction, setDirection] = useState<'def_to_term' | 'term_to_def'>('def_to_term')

  // Match options
  const [matchOptions, setMatchOptions] = useState<MatchOptions>({
    ignoreCase: true,
    ignorePunctuation: true,
    ignoreAccents: false,
  })
  const [showSettings, setShowSettings] = useState(false)

  // Session state
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [correctionInput, setCorrectionInput] = useState('')
  const [checkStatus, setCheckStatus] = useState<
    'idle' | 'exact' | 'fuzzy' | 'incorrect'
  >('idle')
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [incorrectList, setIncorrectList] = useState<
    Array<{ card: Card; userAnswer: string; targetAnswer: string }>
  >([])

  const inputRef = useRef<HTMLInputElement>(null)
  const correctionRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  useEffect(() => {
    if (activeCards.length > 0) {
      setCards([...activeCards].sort(() => Math.random() - 0.5))
      setCurrentIndex(0)
      setInputAnswer('')
      setCorrectionInput('')
      setCheckStatus('idle')
      setScore(0)
      setIsCompleted(false)
      setIncorrectList([])
    }
  }, [activeCards, direction])

  const currentCard = cards[currentIndex]
  const targetAnswer = currentCard
    ? direction === 'def_to_term'
      ? currentCard.term
      : currentCard.definition
    : ''

  // Focus input on each question
  useEffect(() => {
    if (checkStatus === 'idle') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else if (checkStatus === 'incorrect') {
      setTimeout(() => {
        correctionRef.current?.focus()
      }, 50)
    }
  }, [currentIndex, checkStatus])

  const handleCheck = () => {
    if (!currentCard || !inputAnswer.trim() || checkStatus !== 'idle') return

    const result = compareAnswers(inputAnswer, targetAnswer, matchOptions)

    if (result.isExact) {
      setCheckStatus('exact')
      setScore((s) => s + 1)
      if (activeDeck) {
        speakText(currentCard.term, activeDeck.termLang)
      }
    } else if (result.isFuzzyMatch) {
      setCheckStatus('fuzzy')
      setScore((s) => s + 1)
      if (activeDeck) {
        speakText(currentCard.term, activeDeck.termLang)
      }
    } else {
      setCheckStatus('incorrect')
      setIncorrectList((prev) => [
        ...prev,
        { card: currentCard, userAnswer: inputAnswer, targetAnswer },
      ])
    }
  }

  const handleNext = async () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1)
      setInputAnswer('')
      setCorrectionInput('')
      setCheckStatus('idle')
    } else {
      setIsCompleted(true)
      const finalScore = score + (checkStatus === 'exact' || checkStatus === 'fuzzy' ? 1 : 0)

      if (finalScore / cards.length >= 0.8) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          })
        } catch {
          // ignore
        }
      }

      if (activeDeck) {
        await repository.sessions.record({
          deckId: activeDeck.id,
          mode: 'type-in',
          date: Date.now(),
          correct: score,
          total: cards.length,
        })
        await repository.decks.recordStudy(activeDeck.id)
      }
    }
  }

  const handleRestart = () => {
    setCards([...activeCards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setInputAnswer('')
    setCorrectionInput('')
    setCheckStatus('idle')
    setScore(0)
    setIsCompleted(false)
    setIncorrectList([])
  }

  const toggleDirection = () => {
    setDirection((d) => (d === 'def_to_term' ? 'term_to_def' : 'def_to_term'))
  }

  if (!activeDeck || cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-slate-500 mb-4">Bộ thẻ hiện chưa có thuật ngữ nào để luyện gõ.</p>
          <Button onClick={() => navigate(id ? `/deck/${id}` : '/')}>Quay lại</Button>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100)

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Exit button, Progress Bar, Direction Toggle, Settings Button */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/deck/${activeDeck.id}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thoát"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-md mx-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Câu {currentIndex + 1} / {cards.length}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                <ArrowLeftRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {direction === 'def_to_term' ? 'Nghĩa ➔ Từ' : 'Từ ➔ Nghĩa'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Direction Button */}
            <button
              onClick={toggleDirection}
              className="p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600"
              title="Đảo chiều câu hỏi (Nghĩa ➔ Từ hoặc Từ ➔ Nghĩa)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Đảo chiều</span>
            </button>

            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                  showSettings
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                title="Tùy chọn chấm điểm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Tùy chọn</span>
              </button>

              {/* Options Dropdown Menu */}
              {showSettings && (
                <div className="absolute right-0 top-11 z-50 w-64 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tùy chọn chấm điểm
                  </h4>

                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <span>Bỏ qua hoa / thường</span>
                    <input
                      type="checkbox"
                      checked={matchOptions.ignoreCase}
                      onChange={(e) =>
                        setMatchOptions({ ...matchOptions, ignoreCase: e.target.checked })
                      }
                      className="rounded text-indigo-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <span>Bỏ qua dấu câu thừa</span>
                    <input
                      type="checkbox"
                      checked={matchOptions.ignorePunctuation}
                      onChange={(e) =>
                        setMatchOptions({
                          ...matchOptions,
                          ignorePunctuation: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <span>Bỏ qua dấu phụ / thanh điệu</span>
                    <input
                      type="checkbox"
                      checked={matchOptions.ignoreAccents}
                      onChange={(e) =>
                        setMatchOptions({
                          ...matchOptions,
                          ignoreAccents: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Study Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        {isCompleted ? (
          /* Finished Screen */
          <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
              Hoàn thành bài luyện gõ!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
              Bạn đã trả lời đúng {score} / {cards.length} câu (
              {Math.round((score / cards.length) * 100)}%)
            </p>

            {incorrectList.length > 0 && (
              <div className="mb-6 text-left max-h-48 overflow-y-auto p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-1">
                  Các từ cần ôn lại ({incorrectList.length}):
                </span>
                {incorrectList.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-center justify-between pb-1 border-b border-rose-100 dark:border-rose-900/40 last:border-none">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.card.term}</span>
                    <span className="text-slate-500 truncate max-w-[140px]">{item.card.definition}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="md"
                onClick={handleRestart}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Luyện gõ lại
              </Button>
              <Button size="md" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                Về bộ thẻ
              </Button>
            </div>
          </div>
        ) : (
          /* Question Card */
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between min-h-[380px]">
            {/* Top Prompt */}
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-violet-500 mb-2 block">
                {direction === 'def_to_term'
                  ? 'Định nghĩa (Gõ thuật ngữ ngoại ngữ tương ứng)'
                  : 'Thuật ngữ (Gõ nghĩa tiếng Việt tương ứng)'}
              </span>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {direction === 'def_to_term' ? currentCard.definition : currentCard.term}
                  </h2>
                  {direction === 'term_to_def' && currentCard.note && (
                    <p className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 mt-1">
                      [{currentCard.note}]
                    </p>
                  )}
                  {currentCard.example && (
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 italic">
                      Gợi ý ví dụ: "{currentCard.example}"
                    </p>
                  )}
                </div>

                {activeDeck && (
                  <button
                    onClick={() => speakText(currentCard.term, activeDeck.termLang)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Input & Feedback Area */}
            <div className="my-6 space-y-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  disabled={checkStatus !== 'idle'}
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (checkStatus === 'idle') {
                        handleCheck()
                      } else if (checkStatus === 'exact' || checkStatus === 'fuzzy') {
                        handleNext()
                      }
                    }
                  }}
                  placeholder={
                    direction === 'def_to_term'
                      ? 'Gõ thuật ngữ vào đây và nhấn Enter...'
                      : 'Gõ nghĩa tiếng Việt vào đây và nhấn Enter...'
                  }
                  className={cn(
                    'flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border font-bold text-base focus:outline-none transition-all',
                    checkStatus === 'exact'
                      ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/50'
                      : checkStatus === 'fuzzy'
                      ? 'border-amber-500 ring-2 ring-amber-500 bg-amber-50/50'
                      : checkStatus === 'incorrect'
                      ? 'border-rose-500 ring-2 ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />

                {checkStatus === 'idle' ? (
                  <Button
                    size="md"
                    onClick={handleCheck}
                    disabled={!inputAnswer.trim()}
                    className="font-bold shrink-0"
                  >
                    Kiểm tra
                  </Button>
                ) : (
                  <Button
                    size="md"
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="font-bold shrink-0"
                  >
                    Tiếp tục
                  </Button>
                )}
              </div>

              {/* Exact feedback */}
              {checkStatus === 'exact' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Chính xác tuyệt đối! 🎉</span>
                  </div>
                  <button
                    onClick={() => speakText(currentCard.term, activeDeck.termLang)}
                    className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Fuzzy match feedback */}
              {checkStatus === 'fuzzy' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-sm font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>
                      Chấp nhận! Chú ý chính tả: <strong>{targetAnswer}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => speakText(currentCard.term, activeDeck.termLang)}
                    className="p-1 text-amber-600 hover:text-amber-800 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Incorrect feedback with correction step */}
              {checkStatus === 'incorrect' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      <span>Chưa chính xác!</span>
                    </div>
                    <button
                      onClick={() => speakText(currentCard.term, activeDeck.termLang)}
                      className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-xs text-rose-600 dark:text-rose-400 block mb-0.5">
                      Đáp án đúng là:
                    </span>
                    <strong className="text-lg font-black text-rose-900 dark:text-rose-100">
                      {targetAnswer}
                    </strong>
                  </div>

                  {/* Re-type to memorize */}
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60">
                    <label className="text-xs font-medium block text-rose-700 dark:text-rose-300 mb-1">
                      Gõ lại đáp án đúng để ghi nhớ:
                    </label>
                    <input
                      ref={correctionRef}
                      type="text"
                      value={correctionInput}
                      onChange={(e) => setCorrectionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNext()
                        }
                      }}
                      placeholder={targetAnswer}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Tip */}
            <div className="text-center text-xs text-slate-400">
              Nhấn <strong>Enter</strong> để kiểm tra hoặc chuyển tiếp
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
