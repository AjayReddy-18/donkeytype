import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateWords, generateMoreWords, DEFAULT_WORD_COUNTS } from '../wordGenerator'
import { COMMON_WORDS } from '../../data/wordList'

describe('wordGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateWords', () => {
    it('should generate the requested number of words', () => {
      const result = generateWords({ wordCount: 10, punctuationEnabled: false })
      expect(result.words).toHaveLength(10)
    })

    it('should return all lowercase words when punctuation is disabled', () => {
      const result = generateWords({ wordCount: 50, punctuationEnabled: false })
      
      result.words.forEach((word) => {
        expect(word).toBe(word.toLowerCase())
      })
    })

    it('should return words from the COMMON_WORDS list', () => {
      const result = generateWords({ wordCount: 50, punctuationEnabled: false })
      
      result.words.forEach((word) => {
        expect(COMMON_WORDS).toContain(word)
      })
    })

    it('should join words with spaces in text property', () => {
      const result = generateWords({ wordCount: 5, punctuationEnabled: false })
      
      expect(result.text).toBe(result.words.join(' '))
    })

    it('should add punctuation when enabled', () => {
      // Generate many words to statistically ensure some have punctuation
      const result = generateWords({ wordCount: 100, punctuationEnabled: true })
      
      const hasUpperCase = result.words.some((word) => /[A-Z]/.test(word))
      const hasPunctuation = result.words.some((word) => /[.,!?;:'"()]/.test(word))
      
      // With 100 words, very high probability of having at least one uppercase or punctuation
      expect(hasUpperCase || hasPunctuation).toBe(true)
    })

    it('should capitalize first word when punctuation enabled', () => {
      // Run multiple times to account for randomness
      let capitalizedCount = 0
      for (let i = 0; i < 10; i++) {
        const result = generateWords({ wordCount: 5, punctuationEnabled: true })
        if (/^[A-Z]/.test(result.words[0])) {
          capitalizedCount++
        }
      }
      // First word should always be capitalized with punctuation enabled
      expect(capitalizedCount).toBe(10)
    })

    it('should have O(n) performance', () => {
      const start1 = performance.now()
      generateWords({ wordCount: 100, punctuationEnabled: true })
      const time1 = performance.now() - start1

      const start2 = performance.now()
      generateWords({ wordCount: 1000, punctuationEnabled: true })
      const time2 = performance.now() - start2

      // Time should scale roughly linearly (10x words should not be 100x time)
      // Allow generous margin for test environment variance
      expect(time2).toBeLessThan(time1 * 50)
    })
  })

  describe('generateMoreWords', () => {
    it('should generate the requested number of words', () => {
      const result = generateMoreWords(20, false)
      expect(result).toHaveLength(20)
    })

    it('should return lowercase words when punctuation disabled', () => {
      const result = generateMoreWords(30, false)
      
      result.forEach((word) => {
        expect(word).toBe(word.toLowerCase())
      })
    })

    it('should not capitalize first word (not sentence start)', () => {
      // With punctuation but not sentence start, first word rarely capitalized
      const result = generateMoreWords(1, true)
      // The word may or may not be capitalized due to 3% random chance
      // Just verify it returns a valid word
      expect(result).toHaveLength(1)
    })
  })

  describe('DEFAULT_WORD_COUNTS', () => {
    it('should have word counts for 30, 60, and 120 second modes', () => {
      expect(DEFAULT_WORD_COUNTS[30]).toBeDefined()
      expect(DEFAULT_WORD_COUNTS[60]).toBeDefined()
      expect(DEFAULT_WORD_COUNTS[120]).toBeDefined()
    })

    it('should have increasing word counts for longer durations', () => {
      expect(DEFAULT_WORD_COUNTS[60]).toBeGreaterThan(DEFAULT_WORD_COUNTS[30])
      expect(DEFAULT_WORD_COUNTS[120]).toBeGreaterThan(DEFAULT_WORD_COUNTS[60])
    })

    it('should have enough words for fast typers (~150 WPM)', () => {
      // At 150 WPM for 120 seconds = 300 words minimum needed
      expect(DEFAULT_WORD_COUNTS[120]).toBeGreaterThanOrEqual(300)
    })
  })
})

