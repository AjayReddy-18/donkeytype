/**
 * Word Generator - Pure function for offline word generation
 * 
 * Performance: O(n) where n = wordCount
 * - Called ONCE per test start
 * - Must NOT be called per keystroke
 * 
 * Words are:
 * - lowercase only when punctuationEnabled = false
 * - include punctuation randomly when punctuationEnabled = true
 */

import { COMMON_WORDS } from '../data/wordList'

/**
 * Punctuation marks that can be added to words
 */
const PUNCTUATION_END = ['.', ',', '!', '?', ';', ':'] as const
const PUNCTUATION_START = ['"', "'", '('] as const
const PUNCTUATION_END_PAIRS: Record<string, string> = {
  '"': '"',
  "'": "'",
  '(': ')',
}

/**
 * Configuration for word generation
 */
export interface WordGeneratorConfig {
  wordCount: number
  punctuationEnabled: boolean
}

/**
 * Result of word generation
 */
export interface GeneratedWords {
  words: string[]
  text: string
}

/**
 * Generate a random integer in range [0, max)
 * Using Math.random for simplicity - good enough for word selection
 */
const randomInt = (max: number): number => {
  return Math.floor(Math.random() * max)
}

/**
 * Apply punctuation to a word
 * - ~15% chance for ending punctuation
 * - ~5% chance for wrapping quotes/parens
 * - ~3% chance to capitalize (like sentence start)
 */
const applyPunctuation = (word: string, isFirstWord: boolean): string => {
  let result = word
  
  // Capitalize first word or random ~3% for sentence-like feel
  if (isFirstWord || Math.random() < 0.03) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }
  
  // ~5% chance for wrapping punctuation (quotes, parens)
  if (Math.random() < 0.05) {
    const startPunc = PUNCTUATION_START[randomInt(PUNCTUATION_START.length)]
    const endPunc = PUNCTUATION_END_PAIRS[startPunc]
    result = startPunc + result + endPunc
  }
  
  // ~15% chance for ending punctuation
  if (Math.random() < 0.15) {
    const endPunc = PUNCTUATION_END[randomInt(PUNCTUATION_END.length)]
    result = result + endPunc
  }
  
  return result
}

/**
 * Generate an array of words for a typing test
 * 
 * @param config - Configuration with wordCount and punctuationEnabled
 * @returns GeneratedWords with array of words and joined text
 * 
 * Performance: O(n) where n = wordCount
 * - Single pass through word selection
 * - No expensive string operations
 */
export const generateWords = (config: WordGeneratorConfig): GeneratedWords => {
  const { wordCount, punctuationEnabled } = config
  const words: string[] = []
  const wordListLength = COMMON_WORDS.length
  
  for (let i = 0; i < wordCount; i++) {
    // O(1) random word selection
    const randomIndex = randomInt(wordListLength)
    let word = COMMON_WORDS[randomIndex]
    
    // Apply punctuation if enabled
    if (punctuationEnabled) {
      word = applyPunctuation(word, i === 0)
    }
    
    words.push(word)
  }
  
  return {
    words,
    text: words.join(' '),
  }
}

/**
 * Generate additional words to append during test
 * Used when remaining words < threshold
 * 
 * @param count - Number of words to generate
 * @param punctuationEnabled - Whether to include punctuation
 * @returns Array of new words
 */
export const generateMoreWords = (count: number, punctuationEnabled: boolean): string[] => {
  const words: string[] = []
  const wordListLength = COMMON_WORDS.length
  
  for (let i = 0; i < count; i++) {
    const randomIndex = randomInt(wordListLength)
    let word = COMMON_WORDS[randomIndex]
    
    if (punctuationEnabled) {
      // Never capitalize appended words (not sentence start)
      word = applyPunctuation(word, false)
    }
    
    words.push(word)
  }
  
  return words
}

/**
 * Default word count for different time modes
 */
export const DEFAULT_WORD_COUNTS = {
  // Extra words buffer for fast typers (~150 WPM theoretical max)
  30: 100,   // 30s test
  60: 200,   // 60s test
  120: 400,  // 120s test
} as const

export type TimeDuration = keyof typeof DEFAULT_WORD_COUNTS

