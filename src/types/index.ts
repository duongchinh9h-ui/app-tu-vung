export type StudyMode = 'flashcards' | 'learn' | 'test' | 'match' | 'type-in'

export interface Deck {
  id: string
  title: string
  description: string
  termLang: string
  definitionLang: string
  createdAt: number
  updatedAt: number
  cardCount?: number
  dueCount?: number
  lastStudiedAt?: number
}

export interface Card {
  id: string
  deckId: string
  term: string
  definition: string
  example?: string
  note?: string
  imageUrl?: string
  starred: boolean
  order: number
  createdAt?: number
}

export interface CardProgress {
  cardId: string
  deckId?: string
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: number
  lapses: number
  lastReviewed: number | null
}

export interface StudySession {
  id: string
  deckId: string
  mode: StudyMode
  date: number
  correct: number
  total: number
}

export interface LanguageOption {
  code: string
  name: string
  flag?: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'Tiếng Anh (English)' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'ja-JP', name: 'Tiếng Nhật (日本語)' },
  { code: 'ko-KR', name: 'Tiếng Hàn (한국어)' },
  { code: 'zh-CN', name: 'Tiếng Trung (Giản thể)' },
  { code: 'fr-FR', name: 'Tiếng Pháp (Français)' },
  { code: 'de-DE', name: 'Tiếng Đức (Deutsch)' },
  { code: 'es-ES', name: 'Tiếng Tây Ban Nha (Español)' },
  { code: 'ru-RU', name: 'Tiếng Nga (Русский)' },
]
