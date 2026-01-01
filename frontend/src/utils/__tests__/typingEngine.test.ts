import { describe, it, expect } from 'vitest'
import {
  calculateWpm,
  calculateAccuracy,
  compareText,
  getCharStatuses,
} from '../typingEngine'

describe('typingEngine', () => {
  describe('calculateWpm', () => {
    it('should calculate WPM correctly', () => {
      expect(calculateWpm(60, 60)).toBe(12) // 60 chars / 5 = 12 words in 1 minute
      expect(calculateWpm(300, 60)).toBe(60) // 300 chars / 5 = 60 words in 1 minute
      expect(calculateWpm(150, 30)).toBe(60) // 150 chars / 5 = 30 words in 0.5 minutes = 60 WPM
    })

    it('should return 0 when time is 0', () => {
      expect(calculateWpm(100, 0)).toBe(0)
    })

    it('should handle fractional minutes', () => {
      expect(calculateWpm(60, 30)).toBe(24) // 60 chars / 5 = 12 words in 0.5 minutes = 24 WPM
    })

    it('should round to nearest integer', () => {
      expect(calculateWpm(61, 60)).toBe(12) // 12.2 WPM rounds to 12
      expect(calculateWpm(64, 60)).toBe(13) // 12.8 WPM rounds to 13
    })
  })

  describe('calculateAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      expect(calculateAccuracy(90, 100)).toBe(90.0)
      expect(calculateAccuracy(95, 100)).toBe(95.0)
      expect(calculateAccuracy(100, 100)).toBe(100.0)
    })

    it('should return 100 when totalChars is 0', () => {
      expect(calculateAccuracy(0, 0)).toBe(100)
    })

    it('should return 0 when all characters are wrong', () => {
      expect(calculateAccuracy(0, 100)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      expect(calculateAccuracy(95, 100)).toBe(95.0)
      expect(calculateAccuracy(97, 100)).toBe(97.0)
      expect(calculateAccuracy(33, 100)).toBe(33.0)
    })

    it('should handle fractional accuracy', () => {
      const result = calculateAccuracy(99, 100)
      expect(result).toBe(99.0)
    })

    it('should not go below 0', () => {
      expect(calculateAccuracy(-10, 100)).toBe(0)
    })
  })

  describe('compareText', () => {
    it('should compare identical texts correctly', () => {
      const result = compareText('hello', 'hello', 0)
      expect(result.correctChars).toBe(5)
      expect(result.incorrectChars).toBe(0)
      expect(result.totalErrors).toBe(0)
      expect(result.accuracy).toBe(100.0)
    })

    it('should detect incorrect characters', () => {
      const result = compareText('hello', 'hallo', 0)
      expect(result.correctChars).toBe(4)
      expect(result.incorrectChars).toBe(1)
      expect(result.totalErrors).toBe(1)
      expect(result.accuracy).toBeLessThan(100)
    })

    it('should count extra characters as errors', () => {
      const result = compareText('hello', 'helloo', 0)
      expect(result.incorrectChars).toBeGreaterThan(0)
      expect(result.totalErrors).toBeGreaterThan(0)
    })

    it('should handle shorter typed text', () => {
      const result = compareText('hello', 'hel', 0)
      expect(result.correctChars).toBe(3)
      expect(result.incorrectChars).toBe(0)
    })

    it('should track all errors including corrected ones', () => {
      // When allErrors is provided, it represents total mistakes made
      // If typed text is "hello" (5 chars) and we made 2 errors that were corrected,
      // then correctChars = 5 - 2 = 3
      const result = compareText('hello', 'hello', 2)
      expect(result.totalErrors).toBe(2)
      expect(result.correctChars).toBe(3) // 5 - 2 = 3
      expect(result.accuracy).toBeLessThan(100)
      expect(result.accuracy).toBe(60.0) // 3/5 * 100 = 60
    })

    it('should handle empty strings', () => {
      const result = compareText('', '', 0)
      expect(result.correctChars).toBe(0)
      expect(result.incorrectChars).toBe(0)
      expect(result.totalErrors).toBe(0)
      expect(result.accuracy).toBe(100.0)
    })

    it('should handle empty original with typed text', () => {
      const result = compareText('', 'hello', 0)
      expect(result.incorrectChars).toBeGreaterThan(0)
      expect(result.totalErrors).toBeGreaterThan(0)
    })

    it('should handle errors with shorter typed text', () => {
      const result = compareText('hello', 'hel', 1)
      expect(result.totalErrors).toBe(1)
      // typed length is 3, errors is 1, so correct = 3 - 1 = 2
      expect(result.correctChars).toBe(2)
    })
  })

  describe('getCharStatuses', () => {
    it('should mark correct characters as correct', () => {
      const statuses = getCharStatuses('hello', 'hello', 5)
      expect(statuses[0]).toBe('correct')
      expect(statuses[1]).toBe('correct')
      expect(statuses[2]).toBe('correct')
      expect(statuses[3]).toBe('correct')
      expect(statuses[4]).toBe('correct')
    })

    it('should mark incorrect characters as incorrect', () => {
      const statuses = getCharStatuses('hello', 'hallo', 5)
      expect(statuses[0]).toBe('correct')
      expect(statuses[1]).toBe('incorrect')
      expect(statuses[2]).toBe('correct')
      expect(statuses[3]).toBe('correct')
      expect(statuses[4]).toBe('correct')
    })

    it('should mark pending characters as pending', () => {
      // Use currentIndex 6 so that index 5 is pending (not current)
      const statuses = getCharStatuses('hello world', 'hello', 6)
      expect(statuses[0]).toBe('correct')
      expect(statuses[1]).toBe('correct')
      expect(statuses[2]).toBe('correct')
      expect(statuses[3]).toBe('correct')
      expect(statuses[4]).toBe('correct')
      expect(statuses[5]).toBe('pending')
      expect(statuses[6]).toBe('current')
    })

    it('should mark current character correctly', () => {
      const statuses = getCharStatuses('hello', 'hel', 3)
      expect(statuses[3]).toBe('current')
    })

    it('should mark extra characters as incorrect', () => {
      const statuses = getCharStatuses('hello', 'helloo', 6)
      expect(statuses[5]).toBe('incorrect')
    })

    it('should handle empty strings', () => {
      const statuses = getCharStatuses('', '', 0)
      expect(statuses).toEqual([])
    })

    it('should handle longer original text', () => {
      const statuses = getCharStatuses('hello world', 'hello', 5)
      expect(statuses.length).toBe(11)
      // When currentIndex is 5, statuses[5] should be 'current' (the space after 'hello')
      expect(statuses[5]).toBe('current')
      // The rest should be pending
      expect(statuses[6]).toBe('pending')
    })

    it('should handle longer typed text', () => {
      const statuses = getCharStatuses('hello', 'hello world', 11)
      expect(statuses.length).toBe(11)
      expect(statuses[5]).toBe('incorrect')
    })

    it('should handle current index at end of typed text', () => {
      const statuses = getCharStatuses('hello', 'hello', 5)
      // When currentIndex equals typed length, all characters are typed
      expect(statuses.length).toBe(5)
      expect(statuses.every(s => s === 'correct')).toBe(true)
    })
  })
})
