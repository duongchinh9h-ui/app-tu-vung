import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  FileCheck2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Volume2,
  Shuffle,
  BookOpen,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDeckStore } from '../store/deckStore'
import { speakText } from '../lib/tts'
import { compareAnswers } from '../lib/stringMatch'
import {
  generateTestQuestions,
  type QuestionType,
  type QuestionDirection,
  type GeneratedQuestion,
} from '../lib/testGenerator'
import { repository } from '../db'
import { Button } from '../components/common/Button'
import { cn } from '../lib/utils'

export type { QuestionType, QuestionDirection, GeneratedQuestion }

export const TestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, activeCards, loadDeck } = useDeckStore()

  // Configuration state
  const [isConfiguring, setIsConfiguring] = useState(true)
  const [questionCount, setQuestionCount] = useState(10)
  const [questionDirection, setQuestionDirection] =
    useState<QuestionDirection>('term_to_def')
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
    'type_in',
  ])

  // Test session state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [typeInAnswer, setTypeInAnswer] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  // Generator for questions
  const generateQuestions = () => {
    if (activeCards.length === 0) return

    const generated = generateTestQuestions({
      cards: activeCards,
      questionCount,
      selectedTypes,
      questionDirection,
    })

    setQuestions(generated)
    setCurrentIndex(0)
    setSelectedOption(null)
    setTypeInAnswer('')
    setIsSubmitted(false)
    setIsFinished(false)
    setIsConfiguring(false)
  }

  const currentQ = questions[currentIndex]

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return
    setSelectedOption(opt)
    checkAnswer(opt)
  }

  const checkAnswer = (answer: string) => {
    if (!currentQ) return

    let correct = false
    if (currentQ.type === 'multiple_choice') {
      correct = answer === currentQ.correctAnswer
    } else if (currentQ.type === 'true_false') {
      correct = answer === currentQ.correctAnswer
    } else if (currentQ.type === 'type_in') {
      const match = compareAnswers(answer, currentQ.correctAnswer)
      correct = match.isExact || match.isFuzzyMatch
    }

    setQuestions((prev) => {
      const next = [...prev]
      next[currentIndex] = {
        ...next[currentIndex],
        userAnswer: answer,
        isCorrect: correct,
      }
      return next
    })

    setIsSubmitted(true)

    // Optional audio reinforcement on correct answer
    if (correct && activeDeck) {
      if (currentQ.direction === 'def_to_term') {
        speakText(currentQ.card.term, activeDeck.termLang)
      }
    }
  }

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
      setTypeInAnswer('')
      setIsSubmitted(false)
    } else {
      setIsFinished(true)
      const correctCount = questions.filter((q) => q.isCorrect).length

      if (correctCount / questions.length >= 0.8) {
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          })
        } catch {
          // ignore
        }
      }

      if (activeDeck) {
        await repository.sessions.record({
          deckId: activeDeck.id,
          mode: 'test',
          date: Date.now(),
          correct: correctCount,
          total: questions.length,
        })
        await repository.decks.recordStudy(activeDeck.id)
      }
    }
  }

  if (!activeDeck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-slate-500 mb-4">Đang tải bài kiểm tra...</p>
          <Button onClick={() => navigate('/')}>Quay lại</Button>
        </div>
      </div>
    )
  }

  if (activeCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Bộ thẻ này chưa có đủ thuật ngữ để tạo bài kiểm tra.
          </p>
          <Button onClick={() => navigate(`/deck/${activeDeck.id}`)}>Quay lại</Button>
        </div>
      </div>
    )
  }

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((x) => x !== t))
      }
    } else {
      setSelectedTypes([...selectedTypes, t])
    }
  }

  // CONFIGURATION SCREEN
  if (isConfiguring) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="my-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                  Thiết lập bài kiểm tra
                </h2>
                <p className="text-xs text-slate-400 line-clamp-1">{activeDeck.title}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/deck/${activeDeck.id}`)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Direction (Đảo chiều câu hỏi) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chiều câu hỏi (Đảo chiều)
              </label>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {questionDirection === 'term_to_def' && 'Thuận (Từ ➔ Nghĩa)'}
                {questionDirection === 'def_to_term' && 'Nghịch (Nghĩa ➔ Từ)'}
                {questionDirection === 'mixed' && 'Trộn 2 chiều ngẫu nhiên'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: term_to_def */}
              <button
                type="button"
                onClick={() => setQuestionDirection('term_to_def')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  questionDirection === 'term_to_def'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Từ ➔ Nghĩa
                    </span>
                  </div>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      questionDirection === 'term_to_def'
                        ? 'bg-indigo-600'
                        : 'bg-transparent'
                    )}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Nhìn từ ngoại ngữ, chọn/gõ nghĩa tiếng Việt
                </p>
              </button>

              {/* Option 2: def_to_term */}
              <button
                type="button"
                onClick={() => setQuestionDirection('def_to_term')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  questionDirection === 'def_to_term'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Nghĩa ➔ Từ
                    </span>
                  </div>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      questionDirection === 'def_to_term'
                        ? 'bg-indigo-600'
                        : 'bg-transparent'
                    )}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Nhìn nghĩa tiếng Việt, nhớ và chọn từ ngoại ngữ
                </p>
              </button>

              {/* Option 3: mixed */}
              <button
                type="button"
                onClick={() => setQuestionDirection('mixed')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  questionDirection === 'mixed'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Trộn 2 chiều
                    </span>
                  </div>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      questionDirection === 'mixed'
                        ? 'bg-indigo-600'
                        : 'bg-transparent'
                    )}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Xen kẽ cả hai chiều để tối đa hóa phản xạ
                </p>
              </button>
            </div>
          </div>

          {/* Question Count Picker */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Số lượng câu hỏi
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, activeCards.length].map((num, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={cn(
                    'py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer',
                    questionCount === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  )}
                >
                  {idx === 3 ? `Tất cả (${activeCards.length})` : `${num} câu`}
                </button>
              ))}
            </div>
          </div>

          {/* Question Types Picker */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Các dạng câu hỏi
            </label>
            <div className="space-y-2">
              <label
                onClick={() => toggleType('multiple_choice')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none',
                  selectedTypes.includes('multiple_choice')
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <div>
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">
                    Trắc nghiệm 4 đáp án (2x2)
                  </span>
                  <span className="text-xs text-slate-500">
                    Chọn 1 đáp án chính xác trong 4 lựa chọn
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('multiple_choice')}
                  readOnly
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label
                onClick={() => toggleType('true_false')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none',
                  selectedTypes.includes('true_false')
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <div>
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">
                    Đúng / Sai
                  </span>
                  <span className="text-xs text-slate-500">
                    Xác định từ và nghĩa ghép cặp có chính xác không
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('true_false')}
                  readOnly
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label
                onClick={() => toggleType('type_in')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none',
                  selectedTypes.includes('type_in')
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <div>
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">
                    Điền từ / Tự luận
                  </span>
                  <span className="text-xs text-slate-500">
                    Tự gõ chính xác đáp án tương ứng
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('type_in')}
                  readOnly
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <Button
            size="lg"
            onClick={generateQuestions}
            className="w-full font-bold shadow-lg shadow-indigo-600/25"
          >
            Bắt đầu làm bài kiểm tra
          </Button>
        </div>
      </div>
    )
  }

  // RESULTS & REVIEW SCREEN
  if (isFinished) {
    const correctCount = questions.filter((q) => q.isCorrect).length
    const scorePercent = Math.round((correctCount / questions.length) * 100)
    const incorrectQuestions = questions.filter((q) => !q.isCorrect)

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Top Score Summary Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center animate-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kết quả kiểm tra</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">
              {scorePercent}%
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã trả lời đúng {correctCount} / {questions.length} câu hỏi
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsConfiguring(true)
                  setIsFinished(false)
                }}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Làm bài thi mới
              </Button>
              <Button size="md" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                Quay về bộ thẻ
              </Button>
            </div>
          </div>

          {/* Review Incorrect Questions Section */}
          {incorrectQuestions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Xem lại các câu trả lời sai ({incorrectQuestions.length})</span>
              </h2>

              <div className="space-y-3">
                {incorrectQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        <ArrowLeftRight className="w-3 h-3" />
                        {q.direction === 'term_to_def'
                          ? 'Thuật ngữ ➔ Nghĩa'
                          : 'Nghĩa ➔ Thuật ngữ'}
                      </span>
                      <span className="font-semibold text-rose-500">Chưa chính xác</span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {q.prompt}
                        </h4>
                        {q.promptSubtitle && (
                          <span className="text-xs text-indigo-500 font-semibold block mt-0.5">
                            [{q.promptSubtitle}]
                          </span>
                        )}
                      </div>

                      {/* TTS Audio button for foreign term */}
                      {activeDeck && (
                        <button
                          type="button"
                          onClick={() =>
                            speakText(q.card.term, activeDeck.termLang)
                          }
                          className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          title="Nghe phát âm từ vựng"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                        <span className="font-semibold block">Bạn đã chọn/nhập:</span>
                        <span>{q.userAnswer || '(Bỏ trống)'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        <span className="font-semibold block">Đáp án chính xác:</span>
                        <span>{q.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ACTIVE QUESTION SCREEN
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Exit button, Progress Bar, Direction Badge */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/deck/${activeDeck.id}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thoát bài kiểm tra"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-md mx-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                <ArrowLeftRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {currentQ.direction === 'term_to_def'
                  ? 'Từ ➔ Nghĩa'
                  : 'Nghĩa ➔ Từ'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            {currentQ.type === 'multiple_choice' && 'Trắc nghiệm 4 đáp án'}
            {currentQ.type === 'true_false' && 'Đúng hoặc Sai'}
            {currentQ.type === 'type_in' && 'Điền câu trả lời'}
          </span>
        </div>
      </div>

      {/* Center Question Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between min-h-[380px]">
          {/* Question Prompt */}
          <div className="text-center my-auto px-2">
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-500 dark:text-indigo-400 mb-2 block">
              {currentQ.type === 'type_in' &&
                (currentQ.direction === 'term_to_def'
                  ? 'Gõ định nghĩa tiếng Việt cho từ sau:'
                  : 'Gõ thuật ngữ ngoại ngữ cho nghĩa sau:')}
              {currentQ.type === 'multiple_choice' &&
                (currentQ.direction === 'term_to_def'
                  ? 'Chọn định nghĩa tiếng Việt phù hợp:'
                  : 'Chọn thuật ngữ ngoại ngữ phù hợp:')}
              {currentQ.type === 'true_false' &&
                'Xác định câu khẳng định sau là Đúng hay Sai:'}
            </span>

            <div className="inline-flex items-center justify-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentQ.prompt}
              </h2>

              {/* TTS Speaker icon if prompt is foreign term */}
              {currentQ.direction === 'term_to_def' &&
                currentQ.type !== 'true_false' &&
                activeDeck && (
                  <button
                    type="button"
                    onClick={() =>
                      speakText(currentQ.card.term, activeDeck.termLang)
                    }
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
            </div>

            {currentQ.promptSubtitle && (
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                [{currentQ.promptSubtitle}]
              </p>
            )}
          </div>

          {/* DẠNG 1: Trắc nghiệm 4 đáp án lưới 2x2 */}
          {currentQ.type === 'multiple_choice' && currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt
                const isCorrect = opt === currentQ.correctAnswer

                let btnStyle =
                  'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100'

                if (isSubmitted) {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500'
                  } else if (isSelected && !isCorrect) {
                    btnStyle =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500'
                  } else {
                    btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800'
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      'p-4 rounded-2xl border text-left text-sm font-semibold transition-all cursor-pointer flex items-center justify-between',
                      btnStyle
                    )}
                  >
                    <span className="flex-1">{opt}</span>

                    {/* Audio button for foreign options */}
                    {currentQ.direction === 'def_to_term' && activeDeck && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          speakText(opt, activeDeck.termLang)
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors mr-1 cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </span>
                    )}

                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* DẠNG 2: Đúng / Sai */}
          {currentQ.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              {['Đúng', 'Sai'].map((opt) => {
                const isSelected = selectedOption === opt
                const isCorrect = opt === currentQ.correctAnswer

                let btnStyle =
                  'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100'

                if (isSubmitted) {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500'
                  } else if (isSelected && !isCorrect) {
                    btnStyle =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500'
                  } else {
                    btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800'
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      'py-5 rounded-2xl border text-center text-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
                      btnStyle
                    )}
                  >
                    <span>{opt}</span>
                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* DẠNG 3: Điền từ */}
          {currentQ.type === 'type_in' && (
            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  disabled={isSubmitted}
                  value={typeInAnswer}
                  onChange={(e) => setTypeInAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!isSubmitted && typeInAnswer.trim()) {
                        checkAnswer(typeInAnswer)
                      } else if (isSubmitted) {
                        handleNextQuestion()
                      }
                    }
                  }}
                  placeholder={
                    currentQ.direction === 'term_to_def'
                      ? 'Gõ định nghĩa tiếng Việt tương ứng...'
                      : 'Gõ thuật ngữ ngoại ngữ tương ứng...'
                  }
                  className={cn(
                    'flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border focus:outline-none font-medium',
                    isSubmitted
                      ? currentQ.isCorrect
                        ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/50'
                        : 'border-rose-500 ring-2 ring-rose-500 bg-rose-50/50'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
                {!isSubmitted && (
                  <Button
                    size="md"
                    onClick={() => checkAnswer(typeInAnswer)}
                    disabled={!typeInAnswer.trim()}
                  >
                    Kiểm tra
                  </Button>
                )}
              </div>

              {isSubmitted && !currentQ.isCorrect && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <div>
                    Đáp án chính xác: <strong>{currentQ.correctAnswer}</strong>
                  </div>
                  {currentQ.direction === 'def_to_term' && activeDeck && (
                    <button
                      type="button"
                      onClick={() =>
                        speakText(currentQ.card.term, activeDeck.termLang)
                      }
                      className="p-1 text-rose-600 hover:text-rose-800 dark:text-rose-300 cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Next Button */}
        {isSubmitted && (
          <div className="w-full flex justify-end mt-4">
            <Button
              size="md"
              onClick={handleNextQuestion}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-lg shadow-indigo-600/20 font-bold"
            >
              {currentIndex === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
