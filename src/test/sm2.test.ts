import { describe, it, expect } from 'vitest'
import { calculateSM2 } from '../lib/sm2'

describe('SM-2 Algorithm', () => {
  const initialProgress = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
  }

  const fixedNow = 1700000000000 // fixed reference timestamp
  const oneDayMs = 24 * 60 * 60 * 1000

  it('handles first successful review (Good rating = 4)', () => {
    const res = calculateSM2(initialProgress, 4, fixedNow)

    expect(res.repetitions).toBe(1)
    expect(res.interval).toBe(1)
    expect(res.dueDate).toBe(fixedNow + 1 * oneDayMs)
    expect(res.lapses).toBe(0)
    expect(res.easeFactor).toBe(2.5) // EF delta is 0 for rating 4
  })

  it('handles second successful review (Good rating = 4)', () => {
    const firstReview = calculateSM2(initialProgress, 4, fixedNow)
    const secondReview = calculateSM2(firstReview, 4, fixedNow + 1 * oneDayMs)

    expect(secondReview.repetitions).toBe(2)
    expect(secondReview.interval).toBe(6)
    expect(secondReview.dueDate).toBe(fixedNow + 1 * oneDayMs + 6 * oneDayMs)
    expect(secondReview.lapses).toBe(0)
  })

  it('handles third successful review (interval multiplied by easeFactor)', () => {
    const first = calculateSM2(initialProgress, 4, fixedNow)
    const second = calculateSM2(first, 4, fixedNow + 1 * oneDayMs)
    const third = calculateSM2(second, 4, fixedNow + 7 * oneDayMs)

    expect(third.repetitions).toBe(3)
    expect(third.interval).toBe(Math.round(6 * 2.5)) // 15 days
  })

  it('handles failed review (Again rating = 1)', () => {
    const progressWithHistory = {
      easeFactor: 2.5,
      interval: 15,
      repetitions: 3,
      lapses: 0,
    }

    const failed = calculateSM2(progressWithHistory, 1, fixedNow)

    expect(failed.repetitions).toBe(0)
    expect(failed.interval).toBe(1)
    expect(failed.lapses).toBe(1)
    expect(failed.easeFactor).toBeLessThan(2.5)
    expect(failed.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('ensures ease factor never drops below minimum 1.3', () => {
    let p = { ...initialProgress, easeFactor: 1.35 }
    p = calculateSM2(p, 1, fixedNow)
    p = calculateSM2(p, 1, fixedNow)

    expect(p.easeFactor).toBe(1.3)
  })

  it('increases ease factor for Easy rating (5)', () => {
    const res = calculateSM2(initialProgress, 5, fixedNow)
    expect(res.easeFactor).toBe(2.6) // delta +0.1
  })
})
