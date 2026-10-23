import type { CardProgress } from '../types'

/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 *
 * Ratings:
 * 0: Blackout (Quên hoàn toàn)
 * 1: Incorrect (Sai hoàn toàn)
 * 2: Incorrect, but familiar (Sai, nhưng có ấn tượng)
 * 3: Correct with serious difficulty (Đúng nhưng rất khó khăn)
 * 4: Correct after hesitation (Đúng sau khi ngập ngừng)
 * 5: Perfect recall (Nhớ hoàn hảo ngay lập tức)
 *
 * 4-Button simplified rating mapping:
 * - Again (1): Học lại
 * - Hard (3): Khó
 * - Good (4): Tốt
 * - Easy (5): Rất dễ
 */

export type SM2Rating = 1 | 3 | 4 | 5

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: number
  lapses: number
  lastReviewed: number
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function calculateSM2(
  current: Pick<CardProgress, 'easeFactor' | 'interval' | 'repetitions' | 'lapses'>,
  rating: SM2Rating,
  now: number = Date.now()
): SM2Result {
  let { easeFactor, interval, repetitions, lapses } = current

  // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = rating
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  easeFactor = Math.max(1.3, Number((easeFactor + efDelta).toFixed(2)))

  if (rating < 3) {
    // Failed recall (Again)
    repetitions = 0
    interval = 1
    lapses += 1
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = rating === 3 ? 3 : 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  const dueDate = now + interval * ONE_DAY_MS

  return {
    easeFactor,
    interval,
    repetitions,
    dueDate,
    lapses,
    lastReviewed: now,
  }
}
