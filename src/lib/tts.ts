/**
 * Web Speech API text-to-speech utility with multi-language voice detection
 */

let voices: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([])
      return
    }

    const available = window.speechSynthesis.getVoices()
    if (available.length > 0) {
      voices = available
      resolve(available)
      return
    }

    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices()
      resolve(voices)
    }

    // Fallback if event doesn't fire
    setTimeout(() => {
      voices = window.speechSynthesis.getVoices()
      resolve(voices)
    }, 200)
  })
}

// Preload voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
}

export async function speakText(
  text: string,
  lang = 'en-US',
  rate = 0.95
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Trình duyệt không hỗ trợ Web Speech API')
    return
  }

  const cleanText = text.trim()
  if (!cleanText) return

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  if (voices.length === 0) {
    await loadVoices()
  }

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = lang
  utterance.rate = rate

  // Find the best voice for the requested language
  const targetPrefix = lang.split('-')[0].toLowerCase()
  const matchedVoice =
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix))

  if (matchedVoice) {
    utterance.voice = matchedVoice
  }

  return new Promise((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e)
      resolve()
    }

    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
