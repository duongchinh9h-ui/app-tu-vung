import type { Card } from '../types'

export type QuestionType = 'multiple_choice' | 'true_false' | 'type_in'
export type QuestionDirection = 'term_to_def' | 'def_to_term' | 'mixed'

export interface GeneratedQuestion {
  id: string
  card: Card
  type: QuestionType
  direction: 'term_to_def' | 'def_to_term'
  prompt: string
  promptSubtitle?: string
  correctAnswer: string
  options?: string[] // for multiple choice
  isTrueStatement?: boolean // for true/false
  userAnswer?: string
  isCorrect?: boolean
}

export interface TestConfig {
  cards: Card[]
  questionCount: number
  selectedTypes: QuestionType[]
  questionDirection: QuestionDirection
}

/**
 * Generate test questions according to chosen types, count and question direction
 */
export function generateTestQuestions(config: TestConfig): GeneratedQuestion[] {
  const { cards, questionCount, selectedTypes, questionDirection } = config

  if (!cards || cards.length === 0) {
    return []
  }

  const effectiveTypes =
    selectedTypes && selectedTypes.length > 0
      ? selectedTypes
      : (['multiple_choice'] as QuestionType[])

  const total = Math.min(Math.max(1, questionCount), cards.length)
  const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
  const chosenCards = shuffledCards.slice(0, total)

  return chosenCards.map((card, idx) => {
    // Determine direction for this specific question
    let direction: 'term_to_def' | 'def_to_term'
    if (questionDirection === 'def_to_term') {
      direction = 'def_to_term'
    } else if (questionDirection === 'mixed') {
      direction = Math.random() > 0.5 ? 'def_to_term' : 'term_to_def'
    } else {
      direction = 'term_to_def'
    }

    // Pick random question type from user selected types
    const type =
      effectiveTypes[Math.floor(Math.random() * effectiveTypes.length)] ||
      'multiple_choice'

    if (type === 'multiple_choice') {
      if (direction === 'term_to_def') {
        // Thuật ngữ -> Chọn định nghĩa
        const distractorPool = Array.from(
          new Set(
            cards
              .filter((c) => c.id !== card.id)
              .map((c) => c.definition)
              .filter((d) => d !== card.definition)
          )
        )
        const distractors = distractorPool
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)

        const options = [...distractors, card.definition].sort(
          () => Math.random() - 0.5
        )

        return {
          id: `q-${idx}`,
          card,
          type: 'multiple_choice',
          direction: 'term_to_def',
          prompt: card.term,
          promptSubtitle: card.note || undefined,
          correctAnswer: card.definition,
          options,
        }
      } else {
        // Định nghĩa -> Chọn thuật ngữ
        const distractorPool = Array.from(
          new Set(
            cards
              .filter((c) => c.id !== card.id)
              .map((c) => c.term)
              .filter((t) => t !== card.term)
          )
        )
        const distractors = distractorPool
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)

        const options = [...distractors, card.term].sort(
          () => Math.random() - 0.5
        )

        return {
          id: `q-${idx}`,
          card,
          type: 'multiple_choice',
          direction: 'def_to_term',
          prompt: card.definition,
          promptSubtitle: undefined,
          correctAnswer: card.term,
          options,
        }
      }
    } else if (type === 'true_false') {
      const isTrueStatement = Math.random() > 0.5

      if (direction === 'term_to_def') {
        let displayedDef = card.definition
        if (!isTrueStatement && cards.length > 1) {
          const otherCard =
            cards.find((c) => c.id !== card.id && c.definition !== card.definition) ||
            cards.find((c) => c.id !== card.id)
          if (otherCard) {
            displayedDef = otherCard.definition
          }
        }

        return {
          id: `q-${idx}`,
          card,
          type: 'true_false',
          direction: 'term_to_def',
          prompt: `"${card.term}" có nghĩa là "${displayedDef}"`,
          promptSubtitle: card.note || undefined,
          correctAnswer: isTrueStatement ? 'Đúng' : 'Sai',
          isTrueStatement,
        }
      } else {
        let displayedTerm = card.term
        if (!isTrueStatement && cards.length > 1) {
          const otherCard =
            cards.find((c) => c.id !== card.id && c.term !== card.term) ||
            cards.find((c) => c.id !== card.id)
          if (otherCard) {
            displayedTerm = otherCard.term
          }
        }

        return {
          id: `q-${idx}`,
          card,
          type: 'true_false',
          direction: 'def_to_term',
          prompt: `"${card.definition}" tương ứng với thuật ngữ "${displayedTerm}"`,
          promptSubtitle: undefined,
          correctAnswer: isTrueStatement ? 'Đúng' : 'Sai',
          isTrueStatement,
        }
      }
    } else {
      // type_in
      if (direction === 'term_to_def') {
        return {
          id: `q-${idx}`,
          card,
          type: 'type_in',
          direction: 'term_to_def',
          prompt: card.term,
          promptSubtitle: card.note || undefined,
          correctAnswer: card.definition,
        }
      } else {
        return {
          id: `q-${idx}`,
          card,
          type: 'type_in',
          direction: 'def_to_term',
          prompt: card.definition,
          promptSubtitle: undefined,
          correctAnswer: card.term,
        }
      }
    }
  })
}
