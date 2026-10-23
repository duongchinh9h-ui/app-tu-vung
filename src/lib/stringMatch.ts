/**
 * String comparison and fuzzy matching utility for Type-in study mode
 */

export interface MatchOptions {
  ignoreCase?: boolean
  ignorePunctuation?: boolean
  ignoreAccents?: boolean // Bỏ qua dấu tiếng Việt / dấu thanh điệu Pinyin
}

/**
 * Remove Vietnamese accents and pinyin tones
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Normalize a string based on match options
 */
export function normalizeAnswer(text: string, options: MatchOptions = {}): string {
  let res = text.trim()

  if (options.ignoreCase !== false) {
    res = res.toLowerCase()
  }

  if (options.ignoreAccents) {
    res = removeDiacritics(res)
  }

  if (options.ignorePunctuation !== false) {
    // Remove punctuation like .,!?;:'"()~-_[]{}
    res = res.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'，。！？、“”]/g, ' ')
  }

  // Normalize multiple spaces into single space
  return res.replace(/\s+/g, ' ').trim()
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0
  const bn = b ? b.length : 0
  if (an === 0) return bn
  if (bn === 0) return an

  const matrix: number[][] = []
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[bn][an]
}

export interface MatchResult {
  isExact: boolean
  isFuzzyMatch: boolean
  similarity: number
  distance: number
}

/**
 * Compares user answer with target answer
 */
export function compareAnswers(
  userAnswer: string,
  targetAnswer: string,
  options: MatchOptions = {
    ignoreCase: true,
    ignorePunctuation: true,
    ignoreAccents: false,
  }
): MatchResult {
  const normUser = normalizeAnswer(userAnswer, options)
  const normTarget = normalizeAnswer(targetAnswer, options)

  // Direct match
  if (normUser === normTarget && normTarget.length > 0) {
    return {
      isExact: true,
      isFuzzyMatch: true,
      similarity: 1,
      distance: 0,
    }
  }

  // Also check if target has parentheses or slashes (e.g., "Hello (Hi)" or "Appreciate / Value")
  const parts = targetAnswer
    .split(/[/|;]/)
    .map((p) => normalizeAnswer(p, options))
    .filter(Boolean)

  if (parts.includes(normUser)) {
    return {
      isExact: true,
      isFuzzyMatch: true,
      similarity: 1,
      distance: 0,
    }
  }

  // Also check stripping parentheses: "你好 (Nǐ hǎo)" -> user typing "你好" or "Ni hao"
  const cleanTargetNoParen = normalizeAnswer(
    targetAnswer.replace(/\(.*?\)|（.*?）/g, ''),
    options
  )
  if (normUser === cleanTargetNoParen && cleanTargetNoParen.length > 0) {
    return {
      isExact: true,
      isFuzzyMatch: true,
      similarity: 1,
      distance: 0,
    }
  }

  // Pinyin inside parentheses check
  const parenMatch = targetAnswer.match(/\((.*?)\)|（(.*?)）/)
  if (parenMatch) {
    const insideParen = normalizeAnswer(parenMatch[1] || parenMatch[2] || '', options)
    if (normUser === insideParen && insideParen.length > 0) {
      return {
        isExact: true,
        isFuzzyMatch: true,
        similarity: 1,
        distance: 0,
      }
    }
  }

  // Distance calculation
  const maxLen = Math.max(normUser.length, normTarget.length)
  if (maxLen === 0) {
    return { isExact: false, isFuzzyMatch: false, similarity: 0, distance: 0 }
  }

  const distance = levenshteinDistance(normUser, normTarget)
  const similarity = Math.max(0, (maxLen - distance) / maxLen)

  // Slight typo tolerance: for words >= 5 chars, allow distance <= 1
  const isFuzzyMatch = (maxLen >= 5 && distance <= 1) || (maxLen >= 8 && distance <= 2)

  return {
    isExact: false,
    isFuzzyMatch,
    similarity,
    distance,
  }
}
