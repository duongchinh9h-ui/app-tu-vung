import { describe, it, expect } from 'vitest'
import { compareAnswers } from '../lib/stringMatch'

describe('String Match Utility', () => {
  it('correctly compares exact case-insensitive matches', () => {
    const res = compareAnswers('Hello', 'hello')
    expect(res.isExact).toBe(true)
  })

  it('tolerates extra punctuation and spaces', () => {
    const res = compareAnswers('resilient ! ', 'Resilient.')
    expect(res.isExact).toBe(true)
  })

  it('matches words with parentheses like Hán tự and Pinyin', () => {
    const res1 = compareAnswers('你好', '你好 (Nǐ hǎo)')
    expect(res1.isExact).toBe(true)

    const res2 = compareAnswers('Nǐ hǎo', '你好 (Nǐ hǎo)')
    expect(res2.isExact).toBe(true)
  })

  it('supports ignoring accents and diacritics when option is enabled', () => {
    const withAccentOption = { ignoreCase: true, ignorePunctuation: true, ignoreAccents: true }
    const res = compareAnswers('tu tin', 'Tự tin', withAccentOption)
    expect(res.isExact).toBe(true)
  })

  it('detects slight typos as fuzzy match', () => {
    const res = compareAnswers('oppurtunity', 'Opportunity')
    expect(res.isFuzzyMatch).toBe(true)
  })

  it('fails completely incorrect answers', () => {
    const res = compareAnswers('apple', 'banana')
    expect(res.isExact).toBe(false)
    expect(res.isFuzzyMatch).toBe(false)
  })
})
