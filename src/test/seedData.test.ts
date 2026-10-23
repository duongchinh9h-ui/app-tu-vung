import { describe, it, expect } from 'vitest'
import { INITIAL_SEED_DECKS, TOPIK2_SYNONYMS_DECK } from '../db/seedData'

describe('Data Models & Initial Seed Integrity', () => {
  it('contains seed decks with valid metadata', () => {
    expect(INITIAL_SEED_DECKS.length).toBeGreaterThan(0)

    for (const item of INITIAL_SEED_DECKS) {
      expect(item.deck.id).toBeTruthy()
      expect(item.deck.title).toBeTruthy()
      expect(item.deck.termLang).toBeTruthy()
      expect(item.deck.definitionLang).toBeTruthy()
      expect(item.cards.length).toBeGreaterThan(0)
    }
  })

  it('verifies cards within decks have term and definition', () => {
    for (const item of INITIAL_SEED_DECKS) {
      for (const card of item.cards) {
        expect(card.term.trim()).not.toBe('')
        expect(card.definition.trim()).not.toBe('')
      }
    }
  })

  it('ensures Boya 1 decks and TOPIK II synonym deck are present and complete', () => {
    expect(INITIAL_SEED_DECKS.length).toBe(11)
    const boyaDecks = INITIAL_SEED_DECKS.filter((item) => item.deck.id.startsWith('deck-boya'))
    expect(boyaDecks.length).toBe(10)
    for (const item of boyaDecks) {
      expect(item.deck.termLang).toBe('zh-CN')
    }

    const topikDeck = INITIAL_SEED_DECKS.find((item) => item.deck.id === 'deck-topik2-synonyms-40')
    expect(topikDeck).toBeDefined()
    expect(topikDeck?.deck.title).toBe('TopikII 60 Đồng nghĩa')
    expect(topikDeck?.deck.termLang).toBe('ko-KR')
    expect(topikDeck?.cards.length).toBe(60)
    expect(TOPIK2_SYNONYMS_DECK.cards.length).toBe(60)
  })
})
