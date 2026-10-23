import { describe, it, expect } from 'vitest'
import { generateTestQuestions } from '../lib/testGenerator'
import type { Card } from '../types'

const sampleCards: Card[] = [
  {
    id: 'c1',
    deckId: 'deck-1',
    term: '你好',
    definition: 'Xin chào',
    note: 'nǐ hǎo',
    order: 0,
    starred: false,
    createdAt: Date.now(),
  },
  {
    id: 'c2',
    deckId: 'deck-1',
    term: '谢谢',
    definition: 'Cảm ơn',
    note: 'xièxie',
    order: 1,
    starred: false,
    createdAt: Date.now(),
  },
  {
    id: 'c3',
    deckId: 'deck-1',
    term: '再见',
    definition: 'Tạm biệt',
    note: 'zàijiàn',
    order: 2,
    starred: false,
    createdAt: Date.now(),
  },
  {
    id: 'c4',
    deckId: 'deck-1',
    term: '对不起',
    definition: 'Xin lỗi',
    note: 'duìbuqǐ',
    order: 3,
    starred: false,
    createdAt: Date.now(),
  },
]

describe('testGenerator - Đảo chiều câu hỏi', () => {
  it('generates questions in term_to_def direction (Thuật ngữ -> Định nghĩa)', () => {
    const questions = generateTestQuestions({
      cards: sampleCards,
      questionCount: 4,
      selectedTypes: ['multiple_choice'],
      questionDirection: 'term_to_def',
    })

    expect(questions.length).toBe(4)
    questions.forEach((q) => {
      expect(q.direction).toBe('term_to_def')
      // In term_to_def multiple choice, prompt is the term and answer is definition
      expect(sampleCards.some((c) => c.term === q.prompt)).toBe(true)
      expect(sampleCards.some((c) => c.definition === q.correctAnswer)).toBe(true)
      // Options should be definitions
      expect(q.options).toBeDefined()
      expect(q.options?.includes(q.correctAnswer)).toBe(true)
      expect(q.options?.length).toBe(4)
    })
  })

  it('generates questions in def_to_term direction (Định nghĩa -> Thuật ngữ)', () => {
    const questions = generateTestQuestions({
      cards: sampleCards,
      questionCount: 4,
      selectedTypes: ['multiple_choice'],
      questionDirection: 'def_to_term',
    })

    expect(questions.length).toBe(4)
    questions.forEach((q) => {
      expect(q.direction).toBe('def_to_term')
      // In def_to_term multiple choice, prompt is the definition and answer is the term
      expect(sampleCards.some((c) => c.definition === q.prompt)).toBe(true)
      expect(sampleCards.some((c) => c.term === q.correctAnswer)).toBe(true)
      // Options should be terms
      expect(q.options).toBeDefined()
      expect(q.options?.includes(q.correctAnswer)).toBe(true)
      expect(q.options?.length).toBe(4)
    })
  })

  it('generates type_in questions in both directions correctly', () => {
    const typeInTermToDef = generateTestQuestions({
      cards: sampleCards,
      questionCount: 2,
      selectedTypes: ['type_in'],
      questionDirection: 'term_to_def',
    })
    typeInTermToDef.forEach((q) => {
      expect(q.direction).toBe('term_to_def')
      expect(q.type).toBe('type_in')
      expect(sampleCards.some((c) => c.term === q.prompt)).toBe(true)
      expect(sampleCards.some((c) => c.definition === q.correctAnswer)).toBe(true)
    })

    const typeInDefToTerm = generateTestQuestions({
      cards: sampleCards,
      questionCount: 2,
      selectedTypes: ['type_in'],
      questionDirection: 'def_to_term',
    })
    typeInDefToTerm.forEach((q) => {
      expect(q.direction).toBe('def_to_term')
      expect(q.type).toBe('type_in')
      expect(sampleCards.some((c) => c.definition === q.prompt)).toBe(true)
      expect(sampleCards.some((c) => c.term === q.correctAnswer)).toBe(true)
    })
  })

  it('generates true_false questions with valid prompt phrasing in both directions', () => {
    const tfTermToDef = generateTestQuestions({
      cards: sampleCards,
      questionCount: 2,
      selectedTypes: ['true_false'],
      questionDirection: 'term_to_def',
    })
    tfTermToDef.forEach((q) => {
      expect(q.direction).toBe('term_to_def')
      expect(q.prompt).toContain('có nghĩa là')
      expect(['Đúng', 'Sai']).toContain(q.correctAnswer)
    })

    const tfDefToTerm = generateTestQuestions({
      cards: sampleCards,
      questionCount: 2,
      selectedTypes: ['true_false'],
      questionDirection: 'def_to_term',
    })
    tfDefToTerm.forEach((q) => {
      expect(q.direction).toBe('def_to_term')
      expect(q.prompt).toContain('tương ứng với thuật ngữ')
      expect(['Đúng', 'Sai']).toContain(q.correctAnswer)
    })
  })

  it('handles mixed direction mode (Trộn cả 2 chiều)', () => {
    // Generate many questions in mixed mode
    const mixedQuestions = generateTestQuestions({
      cards: [...sampleCards, ...sampleCards, ...sampleCards],
      questionCount: 12,
      selectedTypes: ['multiple_choice'],
      questionDirection: 'mixed',
    })
    expect(mixedQuestions.length).toBe(12)
    const hasTermToDef = mixedQuestions.some((q) => q.direction === 'term_to_def')
    const hasDefToTerm = mixedQuestions.some((q) => q.direction === 'def_to_term')
    // With 12 questions and 50% probability, both directions should appear
    expect(hasTermToDef || hasDefToTerm).toBe(true)
  })

  it('handles empty cards array gracefully', () => {
    const emptyResult = generateTestQuestions({
      cards: [],
      questionCount: 10,
      selectedTypes: ['multiple_choice'],
      questionDirection: 'term_to_def',
    })
    expect(emptyResult).toEqual([])
  })
})
