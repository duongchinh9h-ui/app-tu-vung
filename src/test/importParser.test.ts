import { describe, it, expect } from 'vitest'
import { parseImportText } from '../lib/importParser'

describe('importParser - Nhập dữ liệu Quizlet style', () => {
  it('parses tab-delimited and newline-delimited text correctly (Excel default)', () => {
    const raw = `Apple\tQuả táo\nBanana\tQuả chuối\nOrange\tQuả cam`
    const cards = parseImportText(raw, {
      termDelimiterType: 'tab',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({ term: 'Apple', definition: 'Quả táo' })
    expect(cards[1]).toEqual({ term: 'Banana', definition: 'Quả chuối' })
    expect(cards[2]).toEqual({ term: 'Orange', definition: 'Quả cam' })
  })

  it('parses comma-delimited text correctly', () => {
    const raw = `Book, Quyển sách\nPen, Chiếc bút\nPencil, Bút chì`
    const cards = parseImportText(raw, {
      termDelimiterType: 'comma',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({ term: 'Book', definition: 'Quyển sách' })
    expect(cards[1]).toEqual({ term: 'Pen', definition: 'Chiếc bút' })
    expect(cards[2]).toEqual({ term: 'Pencil', definition: 'Bút chì' })
  })

  it('parses colon-delimited text correctly (both standard : and full-width ：)', () => {
    const raw = `Computer: Máy vi tính\nKeyboard : Bàn phím\n你好：Xin chào`
    const cards = parseImportText(raw, {
      termDelimiterType: 'colon',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({ term: 'Computer', definition: 'Máy vi tính' })
    expect(cards[1]).toEqual({ term: 'Keyboard', definition: 'Bàn phím' })
    expect(cards[2]).toEqual({ term: '你好', definition: 'Xin chào' })
  })

  it('parses custom term delimiter like dash or colon', () => {
    const raw = `Cat - Con mèo\nDog - Con chó\nBird - Con chim`
    const cards = parseImportText(raw, {
      termDelimiterType: 'custom',
      customTermDelimiter: '-',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({ term: 'Cat', definition: 'Con mèo' })
    expect(cards[1]).toEqual({ term: 'Dog', definition: 'Con chó' })
    expect(cards[2]).toEqual({ term: 'Bird', definition: 'Con chim' })
  })

  it('parses semicolon delimited cards on single line', () => {
    const raw = `Hello\tXin chào; Thanks\tCảm ơn; Bye\tTạm biệt`
    const cards = parseImportText(raw, {
      termDelimiterType: 'tab',
      cardDelimiterType: 'semicolon',
    })

    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({ term: 'Hello', definition: 'Xin chào' })
    expect(cards[1]).toEqual({ term: 'Thanks', definition: 'Cảm ơn' })
    expect(cards[2]).toEqual({ term: 'Bye', definition: 'Tạm biệt' })
  })

  it('cleans Excel quotes correctly', () => {
    const raw = `"Hello"\t"Xin chào"\n"World"\t"Thế giới, nhân loại"`
    const cards = parseImportText(raw, {
      termDelimiterType: 'tab',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(2)
    expect(cards[0]).toEqual({ term: 'Hello', definition: 'Xin chào' })
    expect(cards[1]).toEqual({ term: 'World', definition: 'Thế giới, nhân loại' })
  })

  it('ignores empty lines and trims whitespace', () => {
    const raw = `\n\n  Dog \t Con chó   \n\n\n`
    const cards = parseImportText(raw, {
      termDelimiterType: 'tab',
      cardDelimiterType: 'newline',
    })

    expect(cards).toHaveLength(1)
    expect(cards[0]).toEqual({ term: 'Dog', definition: 'Con chó' })
  })

  it('returns empty array for empty input', () => {
    const cards = parseImportText('', {
      termDelimiterType: 'tab',
      cardDelimiterType: 'newline',
    })
    expect(cards).toEqual([])
  })
})
