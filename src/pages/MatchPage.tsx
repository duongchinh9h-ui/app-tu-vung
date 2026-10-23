import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Timer,
  Trophy,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useDeckStore } from '../store/deckStore'
import { repository } from '../db'
import { Button } from '../components/common/Button'
import { cn } from '../lib/utils'

interface MatchTile {
  id: string // unique tile id
  cardId: string
  text: string
  isTerm: boolean
  isMatched: boolean
}

export const MatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeDeck, activeCards, loadDeck } = useDeckStore()

  const [tiles, setTiles] = useState<MatchTile[]>([])
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null)
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(new Set())

  // Stopwatch state
  const [elapsedTime, setElapsedTime] = useState(0) // in tenths of a second
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const timerRef = useRef<number | null>(null)

  const storageKey = id ? `lkhcards_match_record_${id}` : ''
  const [bestTime, setBestTime] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadDeck(id)
      const saved =
        localStorage.getItem(`lkhcards_match_record_${id}`) ||
        localStorage.getItem(`linguacards_match_record_${id}`)
      if (saved) {
        setBestTime(Number(saved))
      }
    }
  }, [id, loadDeck])

  // Initialize Match game
  const initGame = () => {
    if (activeCards.length === 0) return

    // Pick 6 random cards
    const sampleSize = Math.min(6, activeCards.length)
    const shuffledCards = [...activeCards].sort(() => Math.random() - 0.5).slice(0, sampleSize)

    const gameTiles: MatchTile[] = []
    shuffledCards.forEach((c, idx) => {
      gameTiles.push({
        id: `term-${c.id}-${idx}`,
        cardId: c.id,
        text: c.term,
        isTerm: true,
        isMatched: false,
      })
      gameTiles.push({
        id: `def-${c.id}-${idx}`,
        cardId: c.id,
        text: c.definition,
        isTerm: false,
        isMatched: false,
      })
    })

    // Shuffle tiles
    setTiles(gameTiles.sort(() => Math.random() - 0.5))
    setSelectedTileId(null)
    setWrongPair(null)
    setMatchedCardIds(new Set())
    setElapsedTime(0)
    setIsGameFinished(false)
    setIsNewRecord(false)
    setIsGameRunning(true)
  }

  useEffect(() => {
    if (activeCards.length > 0 && !isGameFinished && tiles.length === 0) {
      initGame()
    }
  }, [activeCards])

  // Timer loop
  useEffect(() => {
    if (isGameRunning && !isGameFinished) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 100)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isGameRunning, isGameFinished])

  // Handle tile click
  const handleTileClick = async (tile: MatchTile) => {
    if (tile.isMatched || wrongPair !== null || !isGameRunning) return

    // Clicked the already selected tile: deselect
    if (selectedTileId === tile.id) {
      setSelectedTileId(null)
      return
    }

    // First tile clicked
    if (!selectedTileId) {
      setSelectedTileId(tile.id)
      return
    }

    // Second tile clicked
    const firstTile = tiles.find((t) => t.id === selectedTileId)
    if (!firstTile) {
      setSelectedTileId(tile.id)
      return
    }

    // Check if it's a match: same cardId and different side
    if (firstTile.cardId === tile.cardId && firstTile.id !== tile.id) {
      // MATCH!
      const nextMatched = new Set(matchedCardIds).add(tile.cardId)
      setMatchedCardIds(nextMatched)
      setSelectedTileId(null)

      setTiles((prev) =>
        prev.map((t) =>
          t.cardId === tile.cardId ? { ...t, isMatched: true } : t
        )
      )

      // Check if all pairs matched
      const totalPairs = tiles.length / 2
      if (nextMatched.size === totalPairs) {
        // Game complete!
        setIsGameRunning(false)
        setIsGameFinished(true)
        if (timerRef.current) clearInterval(timerRef.current)

        const finalTime = elapsedTime + 1
        const previousBest = bestTime

        if (!previousBest || finalTime < previousBest) {
          setIsNewRecord(true)
          setBestTime(finalTime)
          if (id) {
            localStorage.setItem(storageKey, String(finalTime))
          }
        }

        try {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
          })
        } catch {
          // ignore
        }

        // Record session
        if (activeDeck) {
          await repository.sessions.record({
            deckId: activeDeck.id,
            mode: 'match',
            date: Date.now(),
            correct: totalPairs,
            total: totalPairs,
          })
          await repository.decks.recordStudy(activeDeck.id)
        }
      }
    } else {
      // MISMATCH!
      setWrongPair([firstTile.id, tile.id])
      setTimeout(() => {
        setWrongPair(null)
        setSelectedTileId(null)
      }, 500)
    }
  }

  const formatTime = (tenths: number) => {
    const seconds = (tenths / 10).toFixed(1)
    return `${seconds}s`
  }

  if (!activeDeck || activeCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-slate-500 mb-4">Bộ thẻ không đủ số lượng thẻ để chơi Ghép thẻ.</p>
          <Button onClick={() => navigate(id ? `/deck/${id}` : '/')}>Quay lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Exit button, Timer, Best Record */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/deck/${activeDeck.id}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thoát trò chơi"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Stopwatch */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            <Timer className="w-4 h-4 animate-spin text-indigo-500" style={{ animationDuration: '4s' }} />
            <span className="font-mono font-extrabold text-base">
              {formatTime(elapsedTime)}
            </span>
          </div>

          {/* Best Record */}
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Kỷ lục:</span>
            <span>{bestTime ? formatTime(bestTime) : '--'}</span>
          </div>
        </div>
      </div>

      {/* Main Game Board */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {isGameFinished ? (
          /* Victory Screen */
          <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
              {isNewRecord ? '🎉 Kỷ lục mới!' : 'Hoàn thành xuất sắc!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
              Bạn đã ghép chính xác tất cả các cặp thẻ.
            </p>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 mb-6">
              <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                Thời gian hoàn thành
              </span>
              <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                {formatTime(elapsedTime)}
              </span>
              {bestTime && (
                <span className="block text-xs text-slate-400 mt-1">
                  Kỷ lục của bạn: {formatTime(bestTime)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={initGame}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Chơi lại
              </Button>
              <Button size="md" onClick={() => navigate(`/deck/${activeDeck.id}`)}>
                Về bộ thẻ
              </Button>
            </div>
          </div>
        ) : (
          /* Match Grid Tiles */
          <div className="w-full">
            <p className="text-center text-xs text-slate-400 mb-4 font-medium">
              Chạm vào một thuật ngữ và định nghĩa tương ứng để làm chúng biến mất!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[70vh] overflow-y-auto p-1">
              {tiles.map((tile) => {
                if (tile.isMatched) {
                  return (
                    <div
                      key={tile.id}
                      className="min-h-[90px] sm:min-h-[110px] rounded-2xl opacity-0 pointer-events-none transition-opacity duration-300"
                    />
                  )
                }

                const isSelected = selectedTileId === tile.id
                const isWrong = wrongPair && wrongPair.includes(tile.id)

                let style =
                  'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 shadow-sm'

                if (isSelected) {
                  style =
                    'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md ring-2 ring-indigo-400'
                } else if (isWrong) {
                  style =
                    'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 animate-shake ring-2 ring-rose-400'
                }

                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleTileClick(tile)}
                    className={cn(
                      'min-h-[90px] sm:min-h-[110px] p-4 rounded-2xl border text-center font-bold text-sm sm:text-base flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-95 leading-snug',
                      style
                    )}
                  >
                    <span className="line-clamp-3">{tile.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
