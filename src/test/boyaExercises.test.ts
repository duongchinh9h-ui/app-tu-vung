import { describe, it, expect } from 'vitest'
import { BOYA_CLOZE_EXERCISES, BOYA_DIALOGUES } from '../db/boyaExercises'

describe('Boya 1 Exercises & Dialogues Integrity', () => {
  const unitIds = [
    'deck-boya1-unit-1',
    'deck-boya1-unit-2',
    'deck-boya1-unit-3',
    'deck-boya1-unit-4',
    'deck-boya1-unit-5',
    'deck-boya1-unit-6',
    'deck-boya1-unit-7',
    'deck-boya1-unit-8',
    'deck-boya1-unit-9',
    'deck-boya1-unit-10',
  ]

  it('ensures all 10 units have cloze fill-in-the-blank exercises', () => {
    for (const unitId of unitIds) {
      const list = BOYA_CLOZE_EXERCISES[unitId]
      expect(list).toBeDefined()
      expect(list.length).toBeGreaterThanOrEqual(8)

      for (const item of list) {
        expect(item.sentence).toContain('____')
        expect(item.options.length).toBe(4)
        expect(item.options).toContain(item.correctAnswer)
        expect(item.explanation.trim()).not.toBe('')
        expect(item.translation.trim()).not.toBe('')
      }
    }
  })

  it('ensures all 10 units have interactive dialogue conversations', () => {
    for (const unitId of unitIds) {
      const list = BOYA_DIALOGUES[unitId]
      expect(list).toBeDefined()
      expect(list.length).toBeGreaterThanOrEqual(2)

      for (const dialogue of list) {
        expect(dialogue.title.trim()).not.toBe('')
        expect(dialogue.lines.length).toBeGreaterThanOrEqual(3)

        // Must have at least one user response blank turn
        const blankLines = dialogue.lines.filter((l) => l.isBlank)
        expect(blankLines.length).toBeGreaterThanOrEqual(1)

        for (const blankLine of blankLines) {
          expect(blankLine.options).toBeDefined()
          expect(blankLine.options!.length).toBeGreaterThanOrEqual(3)
          expect(blankLine.blankAnswer).toBeTruthy()
          expect(blankLine.options!).toContain(blankLine.blankAnswer)
        }
      }
    }
  })
})
