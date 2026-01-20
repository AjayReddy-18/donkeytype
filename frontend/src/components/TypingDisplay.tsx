import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * TypingDisplay - Monkeytype-style word-based typing display
 * 
 * ===== OWNERSHIP CONTRACT (DO NOT VIOLATE) =====
 * 
 * ENGINE (this component) OWNS:
 * - fullWordsArray[] - all words in test (source of truth)
 * - charStates[][] - per-character state (correct/incorrect/pending)
 * - currentWordIndex, currentCharIndex - cursor position
 * - keystroke counts (total, correct, incorrect)
 * 
 * RENDERER OWNS:
 * - wordsDataRef[] - visible DOM elements only
 * - lineStartIndices[] - layout-measured line breaks
 * - cursor position styling
 * 
 * CRITICAL RULES:
 * 1. Renderer ONLY displays engine state - never recalculates correctness
 * 2. Window shift MUST preserve charStates - styling comes FROM state
 * 3. Keystrokes update charStates, then apply to DOM
 * 4. renderVisibleWindow reads charStates to restore styling
 * 
 * ===== TEXT WINDOWING =====
 * - Only renders ~3 lines of visible words at a time
 * - fullWords[] = source of truth (all words)
 * - visibleWords[] = words currently in DOM (windowed subset)
 * - When user enters line 3, window shifts forward
 * - Old words removed from DOM, new words appended
 * - charStates persists across shifts - no state loss
 * 
 * ===== ACCURACY MODEL (Monkeytype-like) =====
 * - Every keystroke is permanently recorded
 * - Backspace fixes VISUAL state but does NOT erase historical mistakes
 * - Accuracy = correctKeystrokes / totalKeystrokes (historical)
 * 
 * PERFORMANCE: O(1) per keystroke
 * - Keystrokes ONLY toggle CSS classes
 * - Window shift only when threshold crossed (not per keystroke)
 * - No React state updates during typing
 */

// Initial word count to render (enough to fill 3+ lines)
const INITIAL_WORD_COUNT = 50

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
  // Word mode support - CRITICAL for exact termination
  // Returns number of words where user has moved past (space pressed)
  getCompletedWordCount: () => number
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
  
  // ===== CHARACTER STATE TRACKING (CRITICAL for preserving state across shifts) =====
  // charStates[wordIndex][charIndex] = 'pending' | 'correct' | 'incorrect'
  // This is the SOURCE OF TRUTH for character styling
  // Renderer reads this, never recalculates from typing logic
  type CharState = 'pending' | 'correct' | 'incorrect'
  const charStatesRef = useRef<CharState[][]>([])
  
  // overflowStates[wordIndex] = array of overflow character texts
  // Tracks overflow characters that were typed beyond word length
  const overflowStatesRef = useRef<string[][]>([])
  
  // ===== LINE TRACKING (for layout-aware shifting) =====
  // lineStartIndices[i] = first visible word index on line i (0-indexed)
  // e.g., [0, 8, 16] means line 1 starts at word 0, line 2 at word 8, line 3 at word 16
  const lineStartIndicesRef = useRef<number[]>([0])
  
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
  // Reads from charStatesRef and overflowStatesRef to restore styling
  // This ensures state is NEVER lost during window shifts
  const createWordElement = useCallback((word: string, globalIndex: number, isLastWord: boolean): WordData => {
    const wordSpan = document.createElement('span')
    wordSpan.className = 'word'
    wordSpan.dataset.wordIndex = String(globalIndex)
    
    const chars: HTMLSpanElement[] = []
    const expectedChars = word.split('')
    
    // Get stored character states for this word (or create fresh if none)
    const storedCharStates = charStatesRef.current[globalIndex] || []
    
    expectedChars.forEach((char, charIndex) => {
      const charSpan = document.createElement('span')
      // CRITICAL: Apply stored state, default to pending
      const state = storedCharStates[charIndex] || 'pending'
      charSpan.className = `char ${state}`
      charSpan.textContent = char
      charSpan.dataset.charIndex = String(charIndex)
      chars.push(charSpan)
      wordSpan.appendChild(charSpan)
    })
    
    const overflowContainer = document.createElement('span')
    overflowContainer.className = 'overflow-container'
    wordSpan.appendChild(overflowContainer)
    
    // Restore overflow characters from stored state
    const storedOverflow = overflowStatesRef.current[globalIndex] || []
    const overflowChars: HTMLSpanElement[] = []
    storedOverflow.forEach((overflowChar) => {
      const overflowSpan = document.createElement('span')
      overflowSpan.className = 'char overflow'
      overflowSpan.textContent = overflowChar
      overflowContainer.appendChild(overflowSpan)
      overflowChars.push(overflowSpan)
    })
    
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
      overflowChars,
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

  // ===== MEASURE LINE POSITIONS =====
  // Called after rendering to determine which words are on which line
  // This is layout-aware - uses actual Y positions, not character counts
  const measureLinePositions = useCallback(() => {
    if (!textContainerRef.current || wordsDataRef.current.length === 0) return
    
    const containerRect = textContainerRef.current.getBoundingClientRect()
    const lineStarts: number[] = [0] // First word always starts line 0
    let currentLineY = -1
    
    wordsDataRef.current.forEach((wordData, visibleIndex) => {
      const wordRect = wordData.element.getBoundingClientRect()
      // Use top position relative to container to detect line changes
      const wordY = Math.round(wordRect.top - containerRect.top)
      
      // New line detected when Y position changes significantly (> 5px tolerance)
      if (currentLineY === -1) {
        currentLineY = wordY
      } else if (wordY > currentLineY + 5) {
        lineStarts.push(visibleIndex)
        currentLineY = wordY
      }
    })
    
    lineStartIndicesRef.current = lineStarts
  }, [])

  // ===== GET CURRENT LINE NUMBER =====
  // Returns 0-indexed line number for current word position
  const getCurrentLine = useCallback((): number => {
    const visibleIndex = currentWordIndexRef.current - windowStartIndexRef.current
    const lineStarts = lineStartIndicesRef.current
    
    // Find which line this visible index is on
    for (let i = lineStarts.length - 1; i >= 0; i--) {
      if (visibleIndex >= lineStarts[i]) {
        return i
      }
    }
    return 0
  }, [])

  // ===== RENDER VISIBLE WINDOW =====
  // Renders words to fill ~3 lines based on layout measurement
  const renderVisibleWindow = useCallback(() => {
    if (!textContainerRef.current) return
    
    // Clear existing DOM
    textContainerRef.current.innerHTML = ''
    wordsDataRef.current = []
    
    const startIdx = windowStartIndexRef.current
    // Render enough words to definitely fill 3+ lines
    const endIdx = Math.min(startIdx + INITIAL_WORD_COUNT, fullWordsArrayRef.current.length)
    
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
    
    // Measure line positions after DOM is updated
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      measureLinePositions()
      updateCursorPosition()
    })
  }, [createWordElement, updateCursorPosition, measureLinePositions])

  // ===== SHIFT WINDOW FORWARD =====
  // Called when user enters line 3 (0-indexed line 2)
  // Shifts window so line 2 becomes line 1, line 3 becomes line 2
  // This is layout-aware - uses measured line positions
  const shiftWindowForward = useCallback(() => {
    if (!textContainerRef.current) return
    
    // Get current line number (0-indexed)
    const currentLine = getCurrentLine()
    
    // Only shift when cursor enters line 3 (index 2)
    // This means user has moved past line 2
    if (currentLine < 2) return
    
    const lineStarts = lineStartIndicesRef.current
    
    // Need at least 2 lines measured to know where line 2 starts
    if (lineStarts.length < 2) return
    
    // Shift window so that current line 2 becomes line 1
    // This means new window starts at the global index of what was line 2's first word
    const line2StartVisibleIdx = lineStarts[1] // First word of line 2 in visible coords
    const shiftAmount = line2StartVisibleIdx
    
    if (shiftAmount <= 0) return
    
    const newWindowStart = windowStartIndexRef.current + shiftAmount
    
    // Don't shift past available words
    if (newWindowStart >= fullWordsArrayRef.current.length) return
    
    // Update window start
    windowStartIndexRef.current = newWindowStart
    
    // Re-render the visible window
    renderVisibleWindow()
  }, [getCurrentLine, renderVisibleWindow])

  // ===== PRE-RENDER WORDS ON MOUNT =====
  useEffect(() => {
    if (!textContainerRef.current) return
    
    // Store ALL words as source of truth
    const allWords = originalText.split(' ')
    fullWordsArrayRef.current = allWords
    
    // Reset character state tracking for new text
    charStatesRef.current = []
    overflowStatesRef.current = []
    
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
    // Word mode support - returns number of COMPLETED words (user moved past them)
    // CRITICAL: This is the source of truth for word mode termination
    getCompletedWordCount: () => currentWordIndexRef.current,
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
  // Updates both charStatesRef and DOM when marking skipped chars
  const handleSpace = useCallback((wordData: WordData) => {
    if (!hasTypedInCurrentWordRef.current) {
      return // Ignore space at start of word
    }
    
    const globalWordIndex = currentWordIndexRef.current
    const isLastWord = globalWordIndex >= fullWordsArrayRef.current.length - 1
    
    // Ensure char state array exists
    if (!charStatesRef.current[globalWordIndex]) {
      charStatesRef.current[globalWordIndex] = []
    }
    
    // Mark remaining chars as incorrect (skipped)
    // These DO count as errors in permanent stats
    const charIndex = currentCharIndexRef.current
    for (let i = charIndex; i < wordData.expectedChars.length; i++) {
      if (wordData.chars[i].className === 'char pending') {
        // PERSIST state, then update DOM
        charStatesRef.current[globalWordIndex][i] = 'incorrect'
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
  // Updates BOTH: charStatesRef (persistent state) and DOM (visual)
  const handleCharacter = useCallback((key: string, wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    const globalWordIndex = currentWordIndexRef.current
    const isLastWord = globalWordIndex >= fullWordsArrayRef.current.length - 1
    
    hasTypedInCurrentWordRef.current = true
    
    // PERMANENT: Every keystroke is recorded forever
    totalKeystrokesRef.current++
    
    // Ensure char state array exists for this word
    if (!charStatesRef.current[globalWordIndex]) {
      charStatesRef.current[globalWordIndex] = []
    }
    
    if (charIndex < wordLength) {
      const expectedChar = wordData.expectedChars[charIndex]
      const charEl = wordData.chars[charIndex]
      
      if (key === expectedChar) {
        // PERSIST state, then update DOM
        charStatesRef.current[globalWordIndex][charIndex] = 'correct'
        charEl.className = 'char correct'
        correctKeystrokesRef.current++
      } else {
        // PERSIST state, then update DOM
        charStatesRef.current[globalWordIndex][charIndex] = 'incorrect'
        charEl.className = 'char incorrect'
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
      // Overflow character - persist to state
      if (!overflowStatesRef.current[globalWordIndex]) {
        overflowStatesRef.current[globalWordIndex] = []
      }
      overflowStatesRef.current[globalWordIndex].push(key)
      
      // Update DOM
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
  // CRITICAL: Backspace fixes VISUAL state only, NOT permanent keystroke stats
  // BUT it DOES update charStatesRef (so re-render shows correct state)
  const handleBackspace = useCallback((wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    const globalWordIndex = currentWordIndexRef.current
    
    if (charIndex > wordLength && wordData.overflowChars.length > 0) {
      // Remove overflow character - update both state and DOM
      overflowStatesRef.current[globalWordIndex]?.pop()
      const removedChar = wordData.overflowChars.pop()
      if (removedChar) {
        removedChar.remove()
        // DO NOT decrement incorrectKeystrokesRef - error is permanent!
      }
      currentCharIndexRef.current--
    } else if (charIndex > 0 && charIndex <= wordLength) {
      // Remove normal character - update both state and DOM
      currentCharIndexRef.current--
      
      // Update persisted state to pending
      if (charStatesRef.current[globalWordIndex]) {
        charStatesRef.current[globalWordIndex][currentCharIndexRef.current] = 'pending'
      }
      
      const charEl = wordData.chars[currentCharIndexRef.current]
      if (charEl) {
        charEl.className = 'char pending'
        // DO NOT decrement keystroke counters - historical record is permanent!
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
        currentWordIndexRef.current++ // Revert
      }
    }
    
    updateCursorPosition()
    onType?.()
  }, [onType, updateCursorPosition, getVisibleIndex])

  // ===== HANDLE WORD BACKSPACE (Option+Backspace / Ctrl+Backspace) =====
  // Deletes entire current word (or previous word if at start)
  // Updates both charStatesRef and DOM
  const handleWordBackspace = useCallback((wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const globalWordIndex = currentWordIndexRef.current
    
    if (charIndex > 0) {
      // Clear overflow state and DOM
      overflowStatesRef.current[globalWordIndex] = []
      wordData.overflowChars.forEach((el) => el.remove())
      wordData.overflowChars = []
      
      // Reset all char states to pending
      if (charStatesRef.current[globalWordIndex]) {
        charStatesRef.current[globalWordIndex] = charStatesRef.current[globalWordIndex].map(() => 'pending' as const)
      }
      
      // Reset DOM
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
        
        // Clear overflow state and DOM
        overflowStatesRef.current[prevGlobalIndex] = []
        prevWordData.overflowChars.forEach((el) => el.remove())
        prevWordData.overflowChars = []
        
        // Reset all char states to pending
        if (charStatesRef.current[prevGlobalIndex]) {
          charStatesRef.current[prevGlobalIndex] = charStatesRef.current[prevGlobalIndex].map(() => 'pending' as const)
        }
        
        // Reset DOM
        prevWordData.chars.forEach((charEl) => {
          charEl.className = 'char pending'
        })
        
        // Stay at start of this word
        currentCharIndexRef.current = 0
        hasTypedInCurrentWordRef.current = false
      }
      // If previous word not in window, don't go back
    }
    // Note: permanent keystroke stats are NOT decremented - errors are forever
    
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
    
    // Reset character state tracking (CRITICAL - clear all styling state)
    charStatesRef.current = []
    overflowStatesRef.current = []
    
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
