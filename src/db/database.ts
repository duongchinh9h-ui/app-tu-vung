import Dexie, { type Table } from 'dexie'
import type { Deck, Card, CardProgress, StudySession } from '../types'

export class LinguaCardsDatabase extends Dexie {
  decks!: Table<Deck, string>
  cards!: Table<Card, string>
  progress!: Table<CardProgress, string>
  sessions!: Table<StudySession, string>

  constructor() {
    super('LinguaCardsDB')
    this.version(1).stores({
      decks: 'id, title, termLang, definitionLang, createdAt, updatedAt, lastStudiedAt',
      cards: 'id, deckId, term, starred, order, createdAt',
      progress: 'cardId, deckId, dueDate, repetitions, interval, lastReviewed',
      sessions: 'id, deckId, mode, date',
    })
  }
}

export const db = new LinguaCardsDatabase()
