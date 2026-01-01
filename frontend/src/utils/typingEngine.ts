/**
 * Typing engine utilities for calculating WPM, accuracy, and tracking progress
 */

export interface TypingStats {
  wpm: number
  accuracy: number
  totalErrors: number
  correctChars: number
  incorrectChars: number
}

/**
 * Calculate WPM (Words Per Minute)
 * Standard calculation: (characters typed / 5) / time in minutes
 */
export const calculateWpm = (charactersTyped: number, timeSeconds: number): number => {
  if (timeSeconds === 0) return 0
  const minutes = timeSeconds / 60
  const words = charactersTyped / 5 // Standard: 5 characters = 1 word
  return Math.round(words / minutes)
}

/**
 * Calculate accuracy percentage
 * Accuracy = (correct characters / total characters typed) * 100
 * Lower accuracy means more mistakes were made
 */
export const calculateAccuracy = (correctChars: number, totalChars: number): number => {
  if (totalChars === 0) return 100
  const accuracy = (correctChars / totalChars) * 100
  return Math.max(0, Math.round(accuracy * 100) / 100) // Round to 2 decimal places, min 0
}

/**
 * Compare typed text with original text and calculate stats
 * Tracks all errors including corrected ones (Monkeytype style)
 * Accuracy drops whenever a mistake is made, even if corrected later
 */
export const compareText = (original: string, typed: string, allErrors: number = 0): TypingStats => {
  let correctChars = 0
  let incorrectChars = 0
  const minLength = Math.min(original.length, typed.length)

  for (let i = 0; i < minLength; i++) {
    if (original[i] === typed[i]) {
      correctChars++
    } else {
      incorrectChars++
    }
  }

  // Count extra characters as errors
  if (typed.length > original.length) {
    incorrectChars += typed.length - original.length
  }

  // Total errors includes all mistakes made (even if corrected)
  // Use allErrors if provided (tracks all mistakes), otherwise use current incorrect chars
  const totalErrors = allErrors > 0 ? allErrors : incorrectChars
  
  // For accuracy: total characters typed includes all keystrokes
  // If we made errors that were corrected, those still count against accuracy
  const totalChars = typed.length
  
  // Calculate accuracy: correct chars / total chars typed
  // If we have tracked errors, accuracy should reflect that
  // Each error means one character was wrong, so correctChars = totalChars - errors
  const finalCorrectChars = allErrors > 0 
    ? Math.max(0, totalChars - allErrors)
    : correctChars
  
  const accuracy = calculateAccuracy(finalCorrectChars, totalChars)

  return {
    wpm: 0, // Will be calculated with time
    accuracy,
    totalErrors,
    correctChars: finalCorrectChars,
    incorrectChars: totalErrors,
  }
}

/**
 * Get character status for each position (for visual feedback)
 */
export type CharStatus = 'correct' | 'incorrect' | 'pending' | 'current'

export const getCharStatuses = (original: string, typed: string, currentIndex: number): CharStatus[] => {
  const statuses: CharStatus[] = []
  const maxLength = Math.max(original.length, typed.length)

  for (let i = 0; i < maxLength; i++) {
    if (i < typed.length) {
      if (i < original.length) {
        statuses[i] = original[i] === typed[i] ? 'correct' : 'incorrect'
      } else {
        statuses[i] = 'incorrect' // Extra characters
      }
    } else if (i === currentIndex) {
      statuses[i] = 'current'
    } else {
      statuses[i] = 'pending'
    }
  }

  return statuses
}

