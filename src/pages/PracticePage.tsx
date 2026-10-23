import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  FileEdit,
  ArrowRight,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDeckStore } from '../store/deckStore'
import { speakText } from '../lib/tts'
import {
  BOYA_CLOZE_EXERCISES,
  BOYA_DIALOGUES,
} from '../db/boyaExercises'
import { Button } from '../components/common/Button'
import { cn } from '../lib/utils'

export const PracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, loadDeck } = useDeckStore()

  const [activeTab, setActiveTab] = useState<'cloze' | 'dialogue'>('cloze')

  // Cloze state
  const clozeList = id ? BOYA_CLOZE_EXERCISES[id] || [] : []
  const [clozeIndex, setClozeIndex] = useState(0)
  const [selectedClozeAnswer, setSelectedClozeAnswer] = useState<string | null>(null)
  const [isClozeSubmitted, setIsClozeSubmitted] = useState(false)
  const [clozeScore, setClozeScore] = useState(0)
  const [isClozeFinished, setIsClozeFinished] = useState(false)

  // Dialogue state
  const dialogueList = id ? BOYA_DIALOGUES[id] || [] : []
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [selectedDialogueAnswer, setSelectedDialogueAnswer] = useState<string | null>(null)
  const [isDialogueSubmitted, setIsDialogueSubmitted] = useState(false)
  const [dialogueScore, setDialogueScore] = useState(0)
  const [isDialogueFinished, setIsDialogueFinished] = useState(false)

  useEffect(() => {
    if (id) {
      loadDeck(id)
    }
  }, [id, loadDeck])

  // Current items
  const currentCloze = clozeList[clozeIndex]
  const currentDialogue = dialogueList[dialogueIndex]

  // Handlers for Cloze
  const handleSelectCloze = (ans: string) => {
    if (isClozeSubmitted || !currentCloze) return
    setSelectedClozeAnswer(ans)
    setIsClozeSubmitted(true)

    const isCorrect = ans === currentCloze.correctAnswer
    if (isCorrect) {
      setClozeScore((s) => s + 1)
      if (activeDeck) {
        // Speak completed sentence with answer
        const completedSentence = currentCloze.sentence.replace('____', ans)
        speakText(completedSentence, activeDeck.termLang)
      }
    }
  }

  const handleNextCloze = () => {
    if (clozeIndex < clozeList.length - 1) {
      setClozeIndex((i) => i + 1)
      setSelectedClozeAnswer(null)
      setIsClozeSubmitted(false)
    } else {
      setIsClozeFinished(true)
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      } catch {
        // ignore
      }
    }
  }

  const handleRestartCloze = () => {
    setClozeIndex(0)
    setSelectedClozeAnswer(null)
    setIsClozeSubmitted(false)
    setClozeScore(0)
    setIsClozeFinished(false)
  }

  // Handlers for Dialogue
  const handleSelectDialogue = (ans: string, correctAnswer: string) => {
    if (isDialogueSubmitted) return
    setSelectedDialogueAnswer(ans)
    setIsDialogueSubmitted(true)

    if (ans === correctAnswer) {
      setDialogueScore((s) => s + 1)
      if (activeDeck) {
        speakText(ans, activeDeck.termLang)
      }
    }
  }

  const handleNextDialogue = () => {
    if (dialogueIndex < dialogueList.length - 1) {
      setDialogueIndex((i) => i + 1)
      setSelectedDialogueAnswer(null)
      setIsDialogueSubmitted(false)
    } else {
      setIsDialogueFinished(true)
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      } catch {
        // ignore
      }
    }
  }

  const handleRestartDialogue = () => {
    setDialogueIndex(0)
    setSelectedDialogueAnswer(null)
    setIsDialogueSubmitted(false)
    setDialogueScore(0)
    setIsDialogueFinished(false)
  }

  if (!activeDeck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-slate-500 mb-4">Đang tải nội dung bài tập...</p>
          <Button onClick={() => navigate('/')}>Quay lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/deck/${activeDeck.id}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Thoát"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('cloze')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer',
                activeTab === 'cloze'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Điền từ vào câu ({clozeList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dialogue')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer',
                activeTab === 'dialogue'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Đoạn hội thoại ({dialogueList.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-semibold hidden md:block">
            {activeDeck.title}
          </div>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 overflow-y-auto flex flex-col justify-center">
        {/* TAB 1: CLOZE FILL-IN-THE-BLANK */}
        {activeTab === 'cloze' && (
          <div>
            {clozeList.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-sm">Bài học này hiện chưa có bài tập điền từ bổ sung.</p>
              </div>
            ) : isClozeFinished ? (
              /* Cloze Finished Summary */
              <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md mx-auto animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Hoàn thành bài tập điền từ!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Bạn đã làm đúng {clozeScore} / {clozeList.length} câu (
                  {Math.round((clozeScore / clozeList.length) * 100)}%)
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleRestartCloze} leftIcon={<RotateCcw className="w-4 h-4" />}>
                    Làm lại
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                    Về bộ thẻ
                  </Button>
                </div>
              </div>
            ) : (
              /* Active Cloze Question */
              <div className="space-y-6">
                {/* Progress pill */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Câu {clozeIndex + 1} / {clozeList.length}</span>
                  <span>Chọn 1 từ thích hợp điền vào chỗ trống</span>
                </div>

                {/* Sentence Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-bold text-indigo-500">
                      Câu điền khuyết
                    </span>
                    <button
                      onClick={() => speakText(currentCloze.sentence.replace('____', currentCloze.correctAnswer), activeDeck.termLang)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Nghe câu hoàn chỉnh"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-relaxed">
                    {currentCloze.sentence}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 italic">
                    "{currentCloze.translation}"
                  </p>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {currentCloze.options.map((opt) => {
                      const isSelected = selectedClozeAnswer === opt
                      const isCorrect = opt === currentCloze.correctAnswer

                      let btnStyle =
                        'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'

                      if (isClozeSubmitted) {
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
                          disabled={isClozeSubmitted}
                          onClick={() => handleSelectCloze(opt)}
                          className={cn(
                            'p-4 rounded-2xl border text-center text-lg font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2',
                            btnStyle
                          )}
                        >
                          <span>{opt}</span>
                          {isClozeSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                          {isClozeSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {isClozeSubmitted && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1 animate-in fade-in">
                      <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block">
                        💡 Giải thích ngữ pháp & ngữ cảnh:
                      </span>
                      <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                        {currentCloze.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Next button */}
                {isClozeSubmitted && (
                  <div className="flex justify-end">
                    <Button
                      size="md"
                      onClick={handleNextCloze}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="shadow-lg font-bold"
                    >
                      {clozeIndex === clozeList.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIALOGUE CONVERSATIONS */}
        {activeTab === 'dialogue' && (
          <div>
            {dialogueList.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-sm">Bài học này hiện chưa có đoạn hội thoại mẫu bổ sung.</p>
              </div>
            ) : isDialogueFinished ? (
              /* Dialogue Finished */
              <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md mx-auto animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Hoàn thành đoạn hội thoại!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Bạn đã trả lời đúng {dialogueScore} / {dialogueList.length} tình huống phản xạ (
                  {dialogueList.length > 0
                    ? Math.round((dialogueScore / dialogueList.length) * 100)
                    : 100}
                  %).
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleRestartDialogue} leftIcon={<RotateCcw className="w-4 h-4" />}>
                    Luyện lại hội thoại
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                    Về bộ thẻ
                  </Button>
                </div>
              </div>
            ) : (
              /* Active Dialogue Chat View */
              <div className="space-y-4">
                {/* Dialogue Header */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {currentDialogue.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{currentDialogue.scenario}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
                    {dialogueIndex + 1} / {dialogueList.length}
                  </span>
                </div>

                {/* Dialogue Lines Chat Flow */}
                <div className="space-y-3 bg-white/70 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                  {currentDialogue.lines.map((line, idx) => {
                    const isUserResponse = line.isBlank

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-4 rounded-2xl border transition-all space-y-1.5',
                          isUserResponse
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {line.speaker}
                          </span>
                          {!isUserResponse && (
                            <button
                              onClick={() => speakText(line.text, activeDeck.termLang)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isUserResponse ? (
                          /* Interactive Response Choice for User */
                          <div className="space-y-3 pt-1">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                              👉 Lựa chọn câu đáp lại phản xạ chính xác:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {line.options?.map((opt) => {
                                const isSelected = selectedDialogueAnswer === opt
                                const isCorrect = opt === line.blankAnswer

                                let optStyle =
                                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'

                                if (isDialogueSubmitted) {
                                  if (isCorrect) {
                                    optStyle =
                                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500'
                                  } else if (isSelected && !isCorrect) {
                                    optStyle =
                                      'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500'
                                  } else {
                                    optStyle = 'opacity-40'
                                  }
                                }

                                return (
                                  <button
                                    key={opt}
                                    disabled={isDialogueSubmitted}
                                    onClick={() => handleSelectDialogue(opt, line.blankAnswer || '')}
                                    className={cn(
                                      'p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                                      optStyle
                                    )}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>

                            {isDialogueSubmitted && line.explanation && (
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-xl">
                                💡 {line.explanation}
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Regular Conversation Line */
                          <div>
                            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                              {line.text}
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                              {line.pinyin}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                              "{line.translation}"
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Next Dialogue Button */}
                {isDialogueSubmitted && (
                  <div className="flex justify-end">
                    <Button
                      size="md"
                      onClick={handleNextDialogue}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="shadow-lg font-bold"
                    >
                      {dialogueIndex === dialogueList.length - 1 ? 'Xem kết quả' : 'Đoạn hội thoại tiếp theo'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
