import { db } from './database'
import type { Deck, Card, CardProgress, StudySession } from '../types'
import type {
  IAppRepository,
  IDeckRepository,
  ICardRepository,
  IProgressRepository,
  ISessionRepository,
  DeckCreateInput,
  CardCreateInput,
} from '../types/repository'
import { INITIAL_SEED_DECKS } from './seedData'

function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
}

export class DexieDeckRepository implements IDeckRepository {
  async getAll(): Promise<Deck[]> {
    const decks = await db.decks.toArray()
    const now = Date.now()

    // Enrich with card count and due count
    const enriched = await Promise.all(
      decks.map(async (deck) => {
        const cards = await db.cards.where('deckId').equals(deck.id).toArray()
        const cardIds = cards.map((c) => c.id)
        
        // Count cards due
        let dueCount = 0
        if (cardIds.length > 0) {
          const progresses = await db.progress
            .where('cardId')
            .anyOf(cardIds)
            .toArray()
          const progressMap = new Map(progresses.map((p) => [p.cardId, p]))

          for (const card of cards) {
            const p = progressMap.get(card.id)
            if (!p || p.dueDate <= now) {
              dueCount++
            }
          }
        }

        return {
          ...deck,
          cardCount: cards.length,
          dueCount,
        }
      })
    )

    // Sort by lastStudiedAt or updatedAt descending
    return enriched.sort((a, b) => {
      const timeA = a.lastStudiedAt || a.updatedAt
      const timeB = b.lastStudiedAt || b.updatedAt
      return timeB - timeA
    })
  }

  async getById(id: string): Promise<Deck | undefined> {
    const deck = await db.decks.get(id)
    if (!deck) return undefined

    const cards = await db.cards.where('deckId').equals(deck.id).toArray()
    const now = Date.now()
    const cardIds = cards.map((c) => c.id)

    let dueCount = 0
    if (cardIds.length > 0) {
      const progresses = await db.progress
        .where('cardId')
        .anyOf(cardIds)
        .toArray()
      const progressMap = new Map(progresses.map((p) => [p.cardId, p]))

      for (const card of cards) {
        const p = progressMap.get(card.id)
        if (!p || p.dueDate <= now) {
          dueCount++
        }
      }
    }

    return {
      ...deck,
      cardCount: cards.length,
      dueCount,
    }
  }

  async search(query: string): Promise<Deck[]> {
    const q = query.trim().toLowerCase()
    if (!q) return this.getAll()

    const allDecks = await this.getAll()

    // Match title or description
    const matchedDeckIds = new Set<string>()
    for (const deck of allDecks) {
      if (
        deck.title.toLowerCase().includes(q) ||
        deck.description.toLowerCase().includes(q)
      ) {
        matchedDeckIds.add(deck.id)
      }
    }

    // Also search cards content
    const matchingCards = await db.cards
      .filter(
        (c) =>
          c.term.toLowerCase().includes(q) ||
          c.definition.toLowerCase().includes(q)
      )
      .toArray()

    for (const c of matchingCards) {
      matchedDeckIds.add(c.deckId)
    }

    return allDecks.filter((d) => matchedDeckIds.has(d.id))
  }

  async create(
    deckInput: DeckCreateInput,
    cardsInput: CardCreateInput[]
  ): Promise<{ deck: Deck; cards: Card[] }> {
    const now = Date.now()
    const deckId = deckInput.id || generateId('deck')

    const newDeck: Deck = {
      id: deckId,
      title: deckInput.title.trim(),
      description: deckInput.description?.trim() || '',
      termLang: deckInput.termLang || 'en-US',
      definitionLang: deckInput.definitionLang || 'vi-VN',
      createdAt: now,
      updatedAt: now,
    }

    const createdCards: Card[] = cardsInput.map((item, idx) => ({
      id: item.id || generateId('card'),
      deckId,
      term: item.term.trim(),
      definition: item.definition.trim(),
      example: item.example?.trim() || '',
      note: item.note?.trim() || '',
      imageUrl: item.imageUrl?.trim() || '',
      starred: Boolean(item.starred),
      order: item.order ?? idx,
      createdAt: now,
    }))

    const initialProgress: CardProgress[] = createdCards.map((c) => ({
      cardId: c.id,
      deckId,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now, // due immediately
      lapses: 0,
      lastReviewed: null,
    }))

    await db.transaction('rw', [db.decks, db.cards, db.progress], async () => {
      await db.decks.add(newDeck)
      if (createdCards.length > 0) {
        await db.cards.bulkAdd(createdCards)
        await db.progress.bulkAdd(initialProgress)
      }
    })

    return {
      deck: {
        ...newDeck,
        cardCount: createdCards.length,
        dueCount: createdCards.length,
      },
      cards: createdCards,
    }
  }

  async update(
    id: string,
    deckInput: Partial<DeckCreateInput>,
    cardsInput?: CardCreateInput[]
  ): Promise<{ deck: Deck; cards: Card[] }> {
    const existing = await db.decks.get(id)
    if (!existing) {
      throw new Error(`Bộ thẻ với id ${id} không tồn tại`)
    }

    const now = Date.now()
    const updatedDeck: Deck = {
      ...existing,
      ...deckInput,
      updatedAt: now,
    }

    let finalCards: Card[] = []

    await db.transaction('rw', [db.decks, db.cards, db.progress], async () => {
      await db.decks.put(updatedDeck)

      if (cardsInput !== undefined) {
        // Delete old cards not in updated list
        const oldCards = await db.cards.where('deckId').equals(id).toArray()
        const oldCardMap = new Map(oldCards.map((c) => [c.id, c]))
        const incomingIds = new Set(cardsInput.map((c) => c.id).filter(Boolean))

        // Remove cards deleted by user
        for (const old of oldCards) {
          if (!incomingIds.has(old.id)) {
            await db.cards.delete(old.id)
            await db.progress.delete(old.id)
          }
        }

        // Add or update incoming cards
        const newProgressList: CardProgress[] = []
        finalCards = cardsInput.map((item, idx) => {
          const cardId = item.id || generateId('card')
          const isNew = !oldCardMap.has(cardId)
          if (isNew) {
            newProgressList.push({
              cardId,
              deckId: id,
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              dueDate: now,
              lapses: 0,
              lastReviewed: null,
            })
          }
          return {
            id: cardId,
            deckId: id,
            term: item.term.trim(),
            definition: item.definition.trim(),
            example: item.example?.trim() || '',
            note: item.note?.trim() || '',
            imageUrl: item.imageUrl?.trim() || '',
            starred: item.starred !== undefined ? item.starred : (oldCardMap.get(cardId)?.starred ?? false),
            order: item.order ?? idx,
            createdAt: oldCardMap.get(cardId)?.createdAt ?? now,
          }
        })

        await db.cards.bulkPut(finalCards)
        if (newProgressList.length > 0) {
          await db.progress.bulkAdd(newProgressList)
        }
      } else {
        finalCards = await db.cards.where('deckId').equals(id).sortBy('order')
      }
    })

    const enrichedDeck = await this.getById(id)
    return {
      deck: enrichedDeck || updatedDeck,
      cards: finalCards,
    }
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.decks, db.cards, db.progress, db.sessions], async () => {
      const cards = await db.cards.where('deckId').equals(id).toArray()
      const cardIds = cards.map((c) => c.id)

      await db.decks.delete(id)
      await db.cards.where('deckId').equals(id).delete()
      if (cardIds.length > 0) {
        await db.progress.where('cardId').anyOf(cardIds).delete()
      }
      await db.sessions.where('deckId').equals(id).delete()
    })
  }

  async getDueCount(deckId: string): Promise<number> {
    const cards = await db.cards.where('deckId').equals(deckId).toArray()
    if (cards.length === 0) return 0

    const now = Date.now()
    const cardIds = cards.map((c) => c.id)
    const progresses = await db.progress.where('cardId').anyOf(cardIds).toArray()
    const progressMap = new Map(progresses.map((p) => [p.cardId, p]))

    let count = 0
    for (const card of cards) {
      const p = progressMap.get(card.id)
      if (!p || p.dueDate <= now) {
        count++
      }
    }
    return count
  }

  async getTotalDueCount(): Promise<number> {
    const now = Date.now()
    const allCards = await db.cards.toArray()
    if (allCards.length === 0) return 0

    const progresses = await db.progress.toArray()
    const progressMap = new Map(progresses.map((p) => [p.cardId, p]))

    let count = 0
    for (const card of allCards) {
      const p = progressMap.get(card.id)
      if (!p || p.dueDate <= now) {
        count++
      }
    }
    return count
  }

  async getRecentDecks(limit = 4): Promise<Deck[]> {
    const all = await this.getAll()
    return all.slice(0, limit)
  }

  async recordStudy(deckId: string): Promise<void> {
    await db.decks.update(deckId, { lastStudiedAt: Date.now() })
  }
}

export class DexieCardRepository implements ICardRepository {
  async getByDeckId(deckId: string): Promise<Card[]> {
    const cards = await db.cards.where('deckId').equals(deckId).toArray()
    return cards.sort((a, b) => a.order - b.order)
  }

  async getById(id: string): Promise<Card | undefined> {
    return db.cards.get(id)
  }

  async create(deckId: string, cardInput: CardCreateInput): Promise<Card> {
    const now = Date.now()
    const cardId = cardInput.id || generateId('card')
    const existingCards = await db.cards.where('deckId').equals(deckId).toArray()

    const newCard: Card = {
      id: cardId,
      deckId,
      term: cardInput.term.trim(),
      definition: cardInput.definition.trim(),
      example: cardInput.example?.trim() || '',
      note: cardInput.note?.trim() || '',
      imageUrl: cardInput.imageUrl?.trim() || '',
      starred: Boolean(cardInput.starred),
      order: cardInput.order ?? existingCards.length,
      createdAt: now,
    }

    const initialProgress: CardProgress = {
      cardId,
      deckId,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      lapses: 0,
      lastReviewed: null,
    }

    await db.transaction('rw', [db.cards, db.progress, db.decks], async () => {
      await db.cards.add(newCard)
      await db.progress.add(initialProgress)
      await db.decks.update(deckId, { updatedAt: now })
    })

    return newCard
  }

  async update(id: string, cardInput: Partial<Card>): Promise<Card> {
    const existing = await db.cards.get(id)
    if (!existing) {
      throw new Error(`Thẻ với id ${id} không tồn tại`)
    }

    const updated: Card = {
      ...existing,
      ...cardInput,
    }

    await db.cards.put(updated)
    await db.decks.update(updated.deckId, { updatedAt: Date.now() })
    return updated
  }

  async delete(id: string): Promise<void> {
    const existing = await db.cards.get(id)
    if (!existing) return

    await db.transaction('rw', [db.cards, db.progress, db.decks], async () => {
      await db.cards.delete(id)
      await db.progress.delete(id)
      await db.decks.update(existing.deckId, { updatedAt: Date.now() })
    })
  }

  async toggleStar(id: string): Promise<boolean> {
    const card = await db.cards.get(id)
    if (!card) return false

    const newStarred = !card.starred
    await db.cards.update(id, { starred: newStarred })
    return newStarred
  }

  async reorder(_deckId: string, orderedCardIds: string[]): Promise<void> {
    await db.transaction('rw', [db.cards], async () => {
      for (let i = 0; i < orderedCardIds.length; i++) {
        await db.cards.update(orderedCardIds[i], { order: i })
      }
    })
  }
}

export class DexieProgressRepository implements IProgressRepository {
  async get(cardId: string): Promise<CardProgress | undefined> {
    return db.progress.get(cardId)
  }

  async getByDeckId(deckId: string): Promise<CardProgress[]> {
    return db.progress.where('deckId').equals(deckId).toArray()
  }

  async save(progress: CardProgress): Promise<void> {
    await db.progress.put(progress)
  }

  async saveBatch(progressList: CardProgress[]): Promise<void> {
    await db.progress.bulkPut(progressList)
  }

  async getDueCardIds(deckId: string): Promise<string[]> {
    const now = Date.now()
    const cards = await db.cards.where('deckId').equals(deckId).toArray()
    const cardIds = cards.map((c) => c.id)
    if (cardIds.length === 0) return []

    const progresses = await db.progress.where('cardId').anyOf(cardIds).toArray()
    const progressMap = new Map(progresses.map((p) => [p.cardId, p]))

    const dueIds: string[] = []
    for (const c of cards) {
      const p = progressMap.get(c.id)
      if (!p || p.dueDate <= now) {
        dueIds.push(c.id)
      }
    }
    return dueIds
  }
}

export class DexieSessionRepository implements ISessionRepository {
  async record(sessionInput: Omit<StudySession, 'id'>): Promise<StudySession> {
    const session: StudySession = {
      ...sessionInput,
      id: generateId('session'),
    }
    await db.sessions.add(session)
    return session
  }

  async getByDeckId(deckId: string): Promise<StudySession[]> {
    const list = await db.sessions.where('deckId').equals(deckId).toArray()
    return list.sort((a, b) => b.date - a.date)
  }

  async getAll(limit = 100): Promise<StudySession[]> {
    const list = await db.sessions.toArray()
    return list.sort((a, b) => b.date - a.date).slice(0, limit)
  }
}

export class AppRepository implements IAppRepository {
  decks = new DexieDeckRepository()
  cards = new DexieCardRepository()
  progress = new DexieProgressRepository()
  sessions = new DexieSessionRepository()

  async seedIfEmpty(): Promise<boolean> {
    // Ensure all curated seed decks are present and synced with curated cards
    let anyAdded = false
    for (const seed of INITIAL_SEED_DECKS) {
      const existing = await db.decks.get(seed.deck.id)
      if (!existing) {
        await this.decks.create(seed.deck, seed.cards)
        anyAdded = true
      } else {
        // Keep seed deck metadata in sync
        await db.decks.update(seed.deck.id, {
          title: seed.deck.title,
          description: seed.deck.description,
          termLang: seed.deck.termLang,
          definitionLang: seed.deck.definitionLang,
        })

        // Synchronize cards: remove any obsolete cards and insert missing curated cards
        const existingCards = await db.cards.where('deckId').equals(seed.deck.id).toArray()
        const seedTerms = new Set(seed.cards.map((c) => c.term.trim().toLowerCase()))

        for (const ec of existingCards) {
          if (!seedTerms.has(ec.term.trim().toLowerCase())) {
            await this.cards.delete(ec.id)
            anyAdded = true
          }
        }

        const remainingCards = await db.cards.where('deckId').equals(seed.deck.id).toArray()
        const remainingTerms = new Set(remainingCards.map((c) => c.term.trim().toLowerCase()))

        for (const card of seed.cards) {
          if (!remainingTerms.has(card.term.trim().toLowerCase())) {
            await this.cards.create(seed.deck.id, card)
            anyAdded = true
          }
        }
      }
    }
    return anyAdded
  }
}

export const repository = new AppRepository()
