import { create } from 'zustand'
import type { Deck, Card } from '../types'
import type { DeckCreateInput, CardCreateInput } from '../types/repository'
import { repository } from '../db'

interface DeckState {
  decks: Deck[]
  activeDeck: Deck | null
  activeCards: Card[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  searchQuery: string
  totalDueToday: number

  // Actions
  loadDecks: () => Promise<void>
  loadDeck: (id: string) => Promise<void>
  createDeck: (
    deck: DeckCreateInput,
    cards: CardCreateInput[]
  ) => Promise<string>
  updateDeck: (
    id: string,
    deck: Partial<DeckCreateInput>,
    cards?: CardCreateInput[]
  ) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  toggleStarCard: (cardId: string) => Promise<void>
  reorderCards: (deckId: string, orderedCardIds: string[]) => Promise<void>
  setSearchQuery: (query: string) => void
  seedSampleData: () => Promise<void>
  clearActive: () => void
}

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  activeDeck: null,
  activeCards: [],
  isLoading: false,
  isSaving: false,
  error: null,
  searchQuery: '',
  totalDueToday: 0,

  loadDecks: async () => {
    set({ isLoading: true, error: null })
    try {
      // Seed if fresh start
      await repository.seedIfEmpty()

      const query = get().searchQuery
      const [decks, totalDueToday] = await Promise.all([
        query ? repository.decks.search(query) : repository.decks.getAll(),
        repository.decks.getTotalDueCount(),
      ])

      set({ decks, totalDueToday, isLoading: false })
    } catch (err: unknown) {
      console.error('Failed to load decks:', err)
      set({
        error: err instanceof Error ? err.message : 'Không thể tải danh sách bộ thẻ',
        isLoading: false,
      })
    }
  },

  loadDeck: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const [deck, cards] = await Promise.all([
        repository.decks.getById(id),
        repository.cards.getByDeckId(id),
      ])

      if (!deck) {
        set({ error: 'Không tìm thấy bộ thẻ', isLoading: false, activeDeck: null, activeCards: [] })
        return
      }

      set({
        activeDeck: deck,
        activeCards: cards,
        isLoading: false,
      })
    } catch (err: unknown) {
      console.error('Failed to load deck:', err)
      set({
        error: err instanceof Error ? err.message : 'Không thể tải chi tiết bộ thẻ',
        isLoading: false,
      })
    }
  },

  createDeck: async (deckInput, cardsInput) => {
    set({ isSaving: true, error: null })
    try {
      const result = await repository.decks.create(deckInput, cardsInput)
      await get().loadDecks()
      set({ isSaving: false })
      return result.deck.id
    } catch (err: unknown) {
      console.error('Failed to create deck:', err)
      set({
        error: err instanceof Error ? err.message : 'Không thể tạo bộ thẻ mới',
        isSaving: false,
      })
      throw err
    }
  },

  updateDeck: async (id, deckInput, cardsInput) => {
    set({ isSaving: true, error: null })
    try {
      const result = await repository.decks.update(id, deckInput, cardsInput)
      set({
        activeDeck: result.deck,
        activeCards: result.cards,
        isSaving: false,
      })
      await get().loadDecks()
    } catch (err: unknown) {
      console.error('Failed to update deck:', err)
      set({
        error: err instanceof Error ? err.message : 'Không thể cập nhật bộ thẻ',
        isSaving: false,
      })
      throw err
    }
  },

  deleteDeck: async (id: string) => {
    set({ isSaving: true, error: null })
    try {
      await repository.decks.delete(id)
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== id),
        activeDeck: state.activeDeck?.id === id ? null : state.activeDeck,
        activeCards: state.activeDeck?.id === id ? [] : state.activeCards,
        isSaving: false,
      }))
      await get().loadDecks()
    } catch (err: unknown) {
      console.error('Failed to delete deck:', err)
      set({
        error: err instanceof Error ? err.message : 'Không thể xóa bộ thẻ',
        isSaving: false,
      })
      throw err
    }
  },

  toggleStarCard: async (cardId: string) => {
    try {
      const newStarred = await repository.cards.toggleStar(cardId)
      set((state) => ({
        activeCards: state.activeCards.map((c) =>
          c.id === cardId ? { ...c, starred: newStarred } : c
        ),
      }))
    } catch (err) {
      console.error('Failed to toggle star:', err)
    }
  },

  reorderCards: async (deckId: string, orderedCardIds: string[]) => {
    try {
      await repository.cards.reorder(deckId, orderedCardIds)
      const cards = await repository.cards.getByDeckId(deckId)
      set({ activeCards: cards })
    } catch (err) {
      console.error('Failed to reorder cards:', err)
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    get().loadDecks()
  },

  seedSampleData: async () => {
    set({ isLoading: true })
    try {
      await repository.seedIfEmpty()
      await get().loadDecks()
    } finally {
      set({ isLoading: false })
    }
  },

  clearActive: () => {
    set({ activeDeck: null, activeCards: [] })
  },
}))
