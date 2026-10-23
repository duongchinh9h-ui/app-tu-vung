import type { Deck, Card, CardProgress, StudySession } from './index'

export interface DeckCreateInput {
  id?: string
  title: string
  description?: string
  termLang: string
  definitionLang: string
}

export interface CardCreateInput {
  id?: string
  term: string
  definition: string
  example?: string
  note?: string
  imageUrl?: string
  starred?: boolean
  order?: number
}

export interface IDeckRepository {
  getAll(): Promise<Deck[]>
  getById(id: string): Promise<Deck | undefined>
  search(query: string): Promise<Deck[]>
  create(
    deck: DeckCreateInput,
    cards: CardCreateInput[]
  ): Promise<{ deck: Deck; cards: Card[] }>
  update(
    id: string,
    deck: Partial<DeckCreateInput>,
    cards?: CardCreateInput[]
  ): Promise<{ deck: Deck; cards: Card[] }>
  delete(id: string): Promise<void>
  getDueCount(deckId: string): Promise<number>
  getTotalDueCount(): Promise<number>
  getRecentDecks(limit?: number): Promise<Deck[]>
  recordStudy(deckId: string): Promise<void>
}

export interface ICardRepository {
  getByDeckId(deckId: string): Promise<Card[]>
  getById(id: string): Promise<Card | undefined>
  create(deckId: string, card: CardCreateInput): Promise<Card>
  update(id: string, card: Partial<Card>): Promise<Card>
  delete(id: string): Promise<void>
  toggleStar(id: string): Promise<boolean>
  reorder(deckId: string, orderedCardIds: string[]): Promise<void>
}

export interface IProgressRepository {
  get(cardId: string): Promise<CardProgress | undefined>
  getByDeckId(deckId: string): Promise<CardProgress[]>
  save(progress: CardProgress): Promise<void>
  saveBatch(progressList: CardProgress[]): Promise<void>
  getDueCardIds(deckId: string): Promise<string[]>
}

export interface ISessionRepository {
  record(session: Omit<StudySession, 'id'>): Promise<StudySession>
  getByDeckId(deckId: string): Promise<StudySession[]>
  getAll(limit?: number): Promise<StudySession[]>
}

export interface IAppRepository {
  decks: IDeckRepository
  cards: ICardRepository
  progress: IProgressRepository
  sessions: ISessionRepository
  seedIfEmpty(): Promise<boolean>
}
