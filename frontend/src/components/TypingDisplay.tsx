import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * TypingDisplay - Monkeytype-style word-based typing display
 * 
 * TEXT WINDOWING:
 * - Only renders ~3 lines of visible words at a time
 * - fullWords[] = source of truth (all words)
 * - visibleWords[] = words currently in DOM (windowed subset)
 * - When user completes line 2, window shifts forward
 * - Old words removed from DOM, new words appended
 * - DOM never contains more than VISIBLE_LINES worth of words
 * 
 * ACCURACY MODEL (Monkeytype-like):
 * - Every keystroke is permanently recorded
 * - Backspace fixes VISUAL state but does NOT erase historical mistakes
 * - Accuracy = correctKeystrokes / totalKeystrokes (historical)
 * - Errors cannot be "cheated away" by backspacing
 * 
 * WORD-BASED MODEL:
 * - Text is divided into words, each word contains characters
 * - Cursor stays within current word until SPACE is typed
 * - Extra characters beyond word length appear as overflow errors
 * - Space finalizes word ONLY if at least one character was typed
 * 
 * TEST COMPLETION:
 * - Ends immediately when last character of last word is typed
 * - Does NOT require trailing space
 * 
 * PERFORMANCE: O(1) per keystroke
 * - Keystrokes ONLY toggle CSS classes
 * - Window shift only when threshold crossed (not per keystroke)
 * - No React state updates during typing
 */

// Number of visible lines (Monkeytype shows 3)
const VISIBLE_LINES = 3
// Approximate words per line (depends on word length, this is conservative)
const WORDS_PER_LINE = 12
// Total visible words in DOM at any time
const VISIBLE_WORD_COUNT = VISIBLE_LINES * WORDS_PER_LINE

export interface TypingDisplayHandle {
  handleKeyDown: (e: KeyboardEvent) => void
  reset: () => void
  getCurrentIndex: () => number
  // Permanent stats (NEVER decremented by backspace)
  getTotalKeystrokes: () => number
  getCorrectKeystrokes: () => number
  getIncorrectKeystrokes: () => number
  isComplete: () => boolean
  focus: () => void
  // Timed mode support
  appendWords: (newWords: string[]) => void
  getRemainingWordCount: () => number
  forceComplete: () => void
}

interface TypingDisplayProps {
  originalText: string
  onStart?: () => void
  onComplete?: (stats: { 
    totalKeystrokes: number
    correctKeystrokes: number
    incorrectKeystrokes: number 
  }) => void
  onType?: () => void
}

interface WordData {
  element: HTMLSpanElement
  chars: HTMLSpanElement[]
  expectedChars: string[]
  overflowChars: HTMLSpanElement[]
  overflowContainer: HTMLSpanElement
}

const TypingDisplay = forwardRef<TypingDisplayHandle, TypingDisplayProps>(({
  originalText,
  onStart,
  onComplete,
  onType,
}, ref) => {
  // ===== REFS FOR STATE (no React state during typing!) =====
  const containerRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  
  // ===== WINDOWING STATE =====
  // fullWordsArray = ALL words (source of truth)
  // wordsDataRef = only VISIBLE words in DOM
  // windowStartIndex = index in fullWordsArray where visible window starts
  const fullWordsArrayRef = useRef<string[]>([])
  const windowStartIndexRef = useRef(0)
  const wordsDataRef = useRef<WordData[]>([])
  const wordsArrayRef = useRef<string[]>([]) // Visible words array (subset)
  
  // ===== PERMANENT STATS - NEVER DECREMENTED BY BACKSPACE =====
  // These track the HISTORICAL typing record, not just current state
  const totalKeystrokesRef = useRef(0)      // Every character typed
  const correctKeystrokesRef = useRef(0)    // Correct characters typed
  const incorrectKeystrokesRef = useRef(0)  // Incorrect + overflow characters
  
  // ===== CURSOR/POSITION STATE =====
  // currentWordIndexRef = index in fullWordsArray (global position)
  const currentWordIndexRef = useRef(0)
  const currentCharIndexRef = useRef(0)
  const isStartedRef = useRef(false)
  const isCompleteRef = useRef(false)
  const hasTypedInCurrentWordRef = useRef(false)
  
  // ===== COMPLETE TEST FUNCTION =====
  const completeTest = useCallback(() => {
    if (isCompleteRef.current) return // Prevent double completion
    
    isCompleteRef.current = true
    
    // Synchronous callback with PERMANENT stats
    onComplete?.({
      totalKeystrokes: totalKeystrokesRef.current,
      correctKeystrokes: correctKeystrokesRef.current,
      incorrectKeystrokes: incorrectKeystrokesRef.current,
    })
  }, [onComplete])
  
  // ===== HELPER: Create word DOM element =====
  const createWordElement = useCallback((word: string, globalIndex: number, isLastWord: boolean): WordData => {
    const wordSpan = document.createElement('span')
    wordSpan.className = 'word'
    wordSpan.dataset.wordIndex = String(globalIndex)
    
    const chars: HTMLSpanElement[] = []
    const expectedChars = word.split('')
    
    expectedChars.forEach((char, charIndex) => {
      const charSpan = document.createElement('span')
      charSpan.className = 'char pending'
      charSpan.textContent = char
      charSpan.dataset.charIndex = String(charIndex)
      chars.push(charSpan)
      wordSpan.appendChild(charSpan)
    })
    
    const overflowContainer = document.createElement('span')
    overflowContainer.className = 'overflow-container'
    wordSpan.appendChild(overflowContainer)
    
    // Add space after word (except for last word in visible window)
    if (!isLastWord) {
      const spaceSpan = document.createElement('span')
      spaceSpan.className = 'word-space'
      spaceSpan.textContent = ' '
      wordSpan.appendChild(spaceSpan)
    }
    
    return {
      element: wordSpan,
      chars,
      expectedChars,
      overflowChars: [],
      overflowContainer,
    }
  }, [])

  // ===== HELPER: Get visible word index from global index =====
  const getVisibleIndex = useCallback((globalIndex: number): number => {
    return globalIndex - windowStartIndexRef.current
  }, [])

  // ===== HELPER: Get current word data (in visible window) =====
  const getCurrentWordData = useCallback((): WordData | null => {
    const visibleIndex = getVisibleIndex(currentWordIndexRef.current)
    return wordsDataRef.current[visibleIndex] || null
  }, [getVisibleIndex])

  // ===== O(1) CURSOR POSITION UPDATE =====
  // Uses visible index (relative to window) for DOM access
  // MUST be defined before renderVisibleWindow which depends on it
  const updateCursorPosition = useCallback(() => {
    if (!cursorRef.current || !containerRef.current) return
    
    // Get visible index for DOM lookup
    const visibleIndex = currentWordIndexRef.current - windowStartIndexRef.current
    const wordData = wordsDataRef.current[visibleIndex]
    if (!wordData) return
    
    let targetEl: HTMLSpanElement | null = null
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    
    if (charIndex < wordLength) {
      targetEl = wordData.chars[charIndex]
    } else if (charIndex >= wordLength && wordData.overflowChars.length > 0) {
      const overflowIndex = charIndex - wordLength
      if (overflowIndex < wordData.overflowChars.length) {
        targetEl = wordData.overflowChars[overflowIndex]
      } else {
        targetEl = wordData.overflowChars[wordData.overflowChars.length - 1]
      }
    } else if (charIndex >= wordLength) {
      targetEl = wordData.chars[wordLength - 1]
    }
    
    if (targetEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = targetEl.getBoundingClientRect()
      
      const height = charRect.height * 1.1
      const verticalOffset = (height - charRect.height) / 2
      
      const isAtEnd = charIndex >= wordLength || 
        (charIndex >= wordLength && charIndex - wordLength >= wordData.overflowChars.length)
      const left = isAtEnd 
        ? charRect.right - containerRect.left 
        : charRect.left - containerRect.left
      const top = charRect.top - containerRect.top - verticalOffset
      
      cursorRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`
      cursorRef.current.style.height = `${height}px`
      cursorRef.current.style.opacity = '1'
    }
  }, [])

  // ===== RENDER VISIBLE WINDOW =====
  // Only renders VISIBLE_WORD_COUNT words to DOM
  const renderVisibleWindow = useCallback(() => {
    if (!textContainerRef.current) return
    
    // Clear existing DOM
    textContainerRef.current.innerHTML = ''
    wordsDataRef.current = []
    
    const startIdx = windowStartIndexRef.current
    const endIdx = Math.min(startIdx + VISIBLE_WORD_COUNT, fullWordsArrayRef.current.length)
    
    // Extract visible words
    const visibleWords = fullWordsArrayRef.current.slice(startIdx, endIdx)
    wordsArrayRef.current = visibleWords
    
    // Create DOM elements for visible words only
    visibleWords.forEach((word, localIndex) => {
      const globalIndex = startIdx + localIndex
      const isLastInWindow = localIndex === visibleWords.length - 1
      const wordData = createWordElement(word, globalIndex, isLastInWindow)
      wordsDataRef.current.push(wordData)
      textContainerRef.current!.appendChild(wordData.element)
    })
    
    updateCursorPosition()
  }, [createWordElement, updateCursorPosition])

  // ===== SHIFT WINDOW FORWARD =====
  // Called when user types past line 2 (about WORDS_PER_LINE * 2 words)
  const shiftWindowForward = useCallback(() => {
    if (!textContainerRef.current) return
    
    const currentGlobalIndex = currentWordIndexRef.current
    const currentVisibleIndex = getVisibleIndex(currentGlobalIndex)
    
    // Shift threshold: when user is past line 2 (2/3 of visible words)
    const shiftThreshold = Math.floor(VISIBLE_WORD_COUNT * 0.66)
    
    if (currentVisibleIndex < shiftThreshold) return
    
    // Calculate new window start (shift by one line worth of words)
    const shiftAmount = WORDS_PER_LINE
    const newWindowStart = windowStartIndexRef.current + shiftAmount
    
    // Don't shift past available words
    if (newWindowStart >= fullWordsArrayRef.current.length) return
    
    // Update window start
    windowStartIndexRef.current = newWindowStart
    
    // Re-render the visible window
    renderVisibleWindow()
  }, [getVisibleIndex, renderVisibleWindow])

  // ===== PRE-RENDER WORDS ON MOUNT =====
  useEffect(() => {
    if (!textContainerRef.current) return
    
    // Store ALL words as source of truth
    const allWords = originalText.split(' ')
    fullWordsArrayRef.current = allWords
    
    // Reset window position
    windowStartIndexRef.current = 0
    
    // Render initial visible window
    renderVisibleWindow()
  }, [originalText, renderVisibleWindow])

  // ===== EXPOSE METHODS TO PARENT =====
  useImperativeHandle(ref, () => ({
    handleKeyDown,
    reset,
    getCurrentIndex: () => {
      let total = 0
      for (let i = 0; i < currentWordIndexRef.current; i++) {
        total += fullWordsArrayRef.current[i].length + 1
      }
      total += currentCharIndexRef.current
      return total
    },
    // Permanent stats - NEVER decrease
    getTotalKeystrokes: () => totalKeystrokesRef.current,
    getCorrectKeystrokes: () => correctKeystrokesRef.current,
    getIncorrectKeystrokes: () => incorrectKeystrokesRef.current,
    isComplete: () => isCompleteRef.current,
    focus: () => containerRef.current?.focus(),
    // Timed mode support
    appendWords,
    getRemainingWordCount: () => fullWordsArrayRef.current.length - currentWordIndexRef.current,
    forceComplete: completeTest,
  }))

  // ===== O(1) KEYDOWN HANDLER =====
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isCompleteRef.current) return
    
    const key = e.key
    const wordData = getCurrentWordData()
    if (!wordData) return
    
    if (key === 'Backspace') {
      // Option+Backspace (Mac) or Ctrl+Backspace (Windows/Linux) - delete entire word
      if (e.altKey || e.ctrlKey) {
        handleWordBackspace(wordData)
        return
      }
      handleBackspace(wordData)
      return
    }
    
    if (key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    
    if (!isStartedRef.current) {
      isStartedRef.current = true
      onStart?.()
      if (cursorRef.current) {
        cursorRef.current.classList.remove('typing-cursor')
      }
    }
    
    if (key === ' ') {
      handleSpace(wordData)
      return
    }
    
    handleCharacter(key, wordData)
    
  }, [onStart, onComplete, onType, getCurrentWordData])

  // ===== HANDLE SPACE - FINALIZE WORD =====
  const handleSpace = useCallback((wordData: WordData) => {
    if (!hasTypedInCurrentWordRef.current) {
      return // Ignore space at start of word
    }
    
    const globalWordIndex = currentWordIndexRef.current
    const isLastWord = globalWordIndex >= fullWordsArrayRef.current.length - 1
    
    // Mark remaining chars as visually incorrect (skipped)
    // These DO count as errors in permanent stats
    const charIndex = currentCharIndexRef.current
    for (let i = charIndex; i < wordData.expectedChars.length; i++) {
      if (wordData.chars[i].className === 'char pending') {
        wordData.chars[i].className = 'char incorrect'
        // PERMANENT: Skipped chars count as errors
        totalKeystrokesRef.current++
        incorrectKeystrokesRef.current++
      }
    }
    
    if (isLastWord) {
      completeTest()
    } else {
      currentWordIndexRef.current++
      currentCharIndexRef.current = 0
      hasTypedInCurrentWordRef.current = false
      
      // Check if we need to shift the window forward
      shiftWindowForward()
      
      updateCursorPosition()
    }
    
    onType?.()
  }, [completeTest, onType, updateCursorPosition, shiftWindowForward])

  // ===== HANDLE CHARACTER =====
  const handleCharacter = useCallback((key: string, wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    const globalWordIndex = currentWordIndexRef.current
    const isLastWord = globalWordIndex >= fullWordsArrayRef.current.length - 1
    
    hasTypedInCurrentWordRef.current = true
    
    // PERMANENT: Every keystroke is recorded forever
    totalKeystrokesRef.current++
    
    if (charIndex < wordLength) {
      const expectedChar = wordData.expectedChars[charIndex]
      const charEl = wordData.chars[charIndex]
      
      if (key === expectedChar) {
        charEl.className = 'char correct'
        // PERMANENT: Record correct keystroke
        correctKeystrokesRef.current++
      } else {
        charEl.className = 'char incorrect'
        // PERMANENT: Record incorrect keystroke
        incorrectKeystrokesRef.current++
      }
      
      currentCharIndexRef.current++
      
      const isLastCharOfWord = currentCharIndexRef.current >= wordLength
      if (isLastWord && isLastCharOfWord) {
        updateCursorPosition()
        onType?.()
        completeTest()
        return
      }
    } else {
      // Overflow character
      const overflowSpan = document.createElement('span')
      overflowSpan.className = 'char overflow'
      overflowSpan.textContent = key
      wordData.overflowContainer.appendChild(overflowSpan)
      wordData.overflowChars.push(overflowSpan)
      // PERMANENT: Overflow counts as error
      incorrectKeystrokesRef.current++
      currentCharIndexRef.current++
    }
    
    updateCursorPosition()
    onType?.()
  }, [completeTest, onType, updateCursorPosition])

  // ===== HANDLE BACKSPACE =====
  // CRITICAL: Backspace fixes VISUAL state only, NOT permanent stats
  const handleBackspace = useCallback((wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    const globalWordIndex = currentWordIndexRef.current
    
    if (charIndex > wordLength && wordData.overflowChars.length > 0) {
      // Remove overflow character VISUALLY only
      const removedChar = wordData.overflowChars.pop()
      if (removedChar) {
        removedChar.remove()
        // DO NOT decrement incorrectKeystrokesRef - error is permanent!
      }
      currentCharIndexRef.current--
    } else if (charIndex > 0 && charIndex <= wordLength) {
      // Remove normal character VISUALLY only
      currentCharIndexRef.current--
      const charEl = wordData.chars[currentCharIndexRef.current]
      if (charEl) {
        // Reset to pending VISUALLY
        charEl.className = 'char pending'
        // DO NOT decrement correctKeystrokesRef or incorrectKeystrokesRef
        // The historical mistake/success is permanent!
      }
      
      if (currentCharIndexRef.current === 0) {
        hasTypedInCurrentWordRef.current = false
      }
    } else if (charIndex === 0 && globalWordIndex > 0) {
      // Move to previous word
      currentWordIndexRef.current--
      
      // Check if previous word is in current visible window
      const prevVisibleIndex = getVisibleIndex(currentWordIndexRef.current)
      if (prevVisibleIndex >= 0 && prevVisibleIndex < wordsDataRef.current.length) {
        const prevWordData = wordsDataRef.current[prevVisibleIndex]
        currentCharIndexRef.current = prevWordData.expectedChars.length + prevWordData.overflowChars.length
        hasTypedInCurrentWordRef.current = true
      } else {
        // Previous word is not in visible window - don't allow going back
        // This is a design choice to keep things simple
        currentWordIndexRef.current++ // Revert
      }
    }
    
    updateCursorPosition()
    onType?.()
  }, [onType, updateCursorPosition, getVisibleIndex])

  // ===== HANDLE WORD BACKSPACE (Option+Backspace / Ctrl+Backspace) =====
  // Deletes entire current word (or previous word if at start)
  // O(1) relative to typed length - single operation, no loops over typed text
  const handleWordBackspace = useCallback((wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const globalWordIndex = currentWordIndexRef.current
    
    if (charIndex > 0) {
      // Clear all overflow characters VISUALLY
      wordData.overflowChars.forEach((el) => el.remove())
      wordData.overflowChars = []
      
      // Reset all typed characters in current word VISUALLY
      wordData.chars.forEach((charEl) => {
        charEl.className = 'char pending'
      })
      
      // Move cursor to start of current word
      currentCharIndexRef.current = 0
      hasTypedInCurrentWordRef.current = false
    } else if (globalWordIndex > 0) {
      // At start of word, check if previous word is in visible window
      const prevGlobalIndex = globalWordIndex - 1
      const prevVisibleIndex = getVisibleIndex(prevGlobalIndex)
      
      if (prevVisibleIndex >= 0 && prevVisibleIndex < wordsDataRef.current.length) {
        currentWordIndexRef.current--
        const prevWordData = wordsDataRef.current[prevVisibleIndex]
        
        // Clear all overflow characters VISUALLY
        prevWordData.overflowChars.forEach((el) => el.remove())
        prevWordData.overflowChars = []
        
        // Reset all typed characters in previous word VISUALLY
        prevWordData.chars.forEach((charEl) => {
          charEl.className = 'char pending'
        })
        
        // Stay at start of this word
        currentCharIndexRef.current = 0
        hasTypedInCurrentWordRef.current = false
      }
      // If previous word not in window, don't go back
    }
    // Note: permanent stats are NOT decremented - errors are forever
    
    updateCursorPosition()
    onType?.()
  }, [onType, updateCursorPosition, getVisibleIndex])

  // ===== APPEND WORDS (for timed mode) =====
  // Adds words to fullWordsArray (source of truth)
  // DOM is managed separately by window rendering
  const appendWords = useCallback((newWords: string[]) => {
    if (newWords.length === 0) return
    
    // Add to source of truth
    fullWordsArrayRef.current = [...fullWordsArrayRef.current, ...newWords]
    
    // No need to add to DOM - window rendering handles visibility
    // The window will automatically include these words when shifted
  }, [])

  // ===== RESET FUNCTION =====
  const reset = useCallback(() => {
    // Reset position
    currentWordIndexRef.current = 0
    currentCharIndexRef.current = 0
    isStartedRef.current = false
    isCompleteRef.current = false
    hasTypedInCurrentWordRef.current = false
    
    // Reset PERMANENT stats
    totalKeystrokesRef.current = 0
    correctKeystrokesRef.current = 0
    incorrectKeystrokesRef.current = 0
    
    // Reset windowing
    windowStartIndexRef.current = 0
    
    // Re-render visible window from the start
    renderVisibleWindow()
    
    if (cursorRef.current) {
      cursorRef.current.classList.add('typing-cursor')
    }
    
    updateCursorPosition()
  }, [updateCursorPosition, renderVisibleWindow])

  return (
    <div 
      ref={containerRef} 
      className="typing-container"
    >
      <span
        ref={cursorRef}
        className="typing-cursor cursor-smooth"
        aria-hidden="true"
      />
      <div
        ref={textContainerRef}
        className="typing-text"
      />
    </div>
  )
})

TypingDisplay.displayName = 'TypingDisplay'

export default TypingDisplay
