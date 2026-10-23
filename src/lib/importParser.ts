export type TermDelimiterType = 'tab' | 'colon' | 'comma' | 'custom'
export type CardDelimiterType = 'newline' | 'semicolon' | 'custom'

export interface ImportOptions {
  termDelimiterType: TermDelimiterType
  customTermDelimiter?: string
  cardDelimiterType: CardDelimiterType
  customCardDelimiter?: string
}

export interface ParsedCardItem {
  term: string
  definition: string
  note?: string
}

/**
 * Clean field quotes if exported from CSV / Excel (e.g. "hello world" -> hello world)
 */
function cleanField(str: string): string {
  let val = str.trim()
  if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
    val = val.substring(1, val.length - 1).replace(/""/g, '"')
  }
  return val.trim()
}

/**
 * Parses raw text into cards based on term and card delimiters
 */
export function parseImportText(
  rawText: string,
  options: ImportOptions
): ParsedCardItem[] {
  if (!rawText || !rawText.trim()) {
    return []
  }

  // 1. Split cards
  let rawCards: string[] = []
  if (options.cardDelimiterType === 'newline') {
    rawCards = rawText.split(/\r?\n/)
  } else if (options.cardDelimiterType === 'semicolon') {
    rawCards = rawText.split(';')
  } else if (options.cardDelimiterType === 'custom') {
    const delim = options.customCardDelimiter || '\n'
    rawCards = rawText.split(delim)
  }

  // 2. Resolve term delimiter
  let termDelimiter = '\t'
  if (options.termDelimiterType === 'colon') {
    termDelimiter = ':'
  } else if (options.termDelimiterType === 'comma') {
    termDelimiter = ','
  } else if (options.termDelimiterType === 'custom') {
    termDelimiter =
      options.customTermDelimiter !== undefined && options.customTermDelimiter !== ''
        ? options.customTermDelimiter
        : '-'
  }

  const results: ParsedCardItem[] = []

  for (const rawCard of rawCards) {
    const trimmed = rawCard.trim()
    if (!trimmed) continue

    let delimIndex = -1
    let matchedLength = 1

    if (options.termDelimiterType === 'colon') {
      const idxHalf = trimmed.indexOf(':')
      const idxFull = trimmed.indexOf('：')
      if (idxHalf !== -1 && idxFull !== -1) {
        delimIndex = Math.min(idxHalf, idxFull)
        matchedLength = 1
      } else if (idxHalf !== -1) {
        delimIndex = idxHalf
        matchedLength = 1
      } else if (idxFull !== -1) {
        delimIndex = idxFull
        matchedLength = 1
      }
    } else {
      delimIndex = trimmed.indexOf(termDelimiter)
      matchedLength = termDelimiter.length
    }

    if (delimIndex !== -1) {
      const term = cleanField(trimmed.substring(0, delimIndex))
      const def = cleanField(trimmed.substring(delimIndex + matchedLength))

      if (term || def) {
        results.push({
          term,
          definition: def,
        })
      }
    } else {
      // If delimiter not found, check if tab exists as fallback
      if (options.termDelimiterType !== 'tab' && trimmed.includes('\t')) {
        const parts = trimmed.split('\t')
        results.push({
          term: cleanField(parts[0]),
          definition: cleanField(parts.slice(1).join('\t')),
        })
      } else {
        // Line without separator: put into term
        results.push({
          term: cleanField(trimmed),
          definition: '',
        })
      }
    }
  }

  return results
}
