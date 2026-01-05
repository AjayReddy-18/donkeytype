import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * TypingDisplay - Monkeytype-style word-based typing display
 * 
 * WORD-BASED MODEL (like Monkeytype):
 * - Text is divided into words, each word contains characters
 * - Cursor stays within current word until SPACE is typed
 * - Extra characters beyond word length appear as overflow errors
 * - Space finalizes word ONLY if at least one character was typed
 * - Backspace works within word and removes overflow
 * 
 * TEST COMPLETION:
 * - Ends immediately when last character of last word is typed
 * - Does NOT require trailing space
 * - Results appear instantly
 * 
 * PERFORMANCE: O(1) per keystroke
 * - Pre-renders ALL words/characters on mount
 * - Keystrokes ONLY toggle CSS classes
 * - No React state updates during typing
 * - No string building or DOM rebuilding
 */

export interface TypingDisplayHandle {
  handleKeyDown: (e: KeyboardEvent) => void
  reset: () => void
  getCurrentIndex: () => number
  getErrorCount: () => number
  getCorrectCount: () => number
  getTotalTypedCount: () => number
  isComplete: () => boolean
  focus: () => void
}

interface TypingDisplayProps {
  originalText: string
  onStart?: () => void
  onComplete?: (stats: { errorCount: number; correctCount: number; totalTyped: number }) => void
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
  
  // Word-based data structure
  const wordsDataRef = useRef<WordData[]>([])
  const wordsArrayRef = useRef<string[]>([])
  
  // Typing state (refs, NOT React state)
  const currentWordIndexRef = useRef(0)
  const currentCharIndexRef = useRef(0) // Index within current word
  const errorCountRef = useRef(0)
  const correctCountRef = useRef(0)
  const totalTypedRef = useRef(0) // Total keystrokes (correct + incorrect + overflow)
  const isStartedRef = useRef(false)
  const isCompleteRef = useRef(false)
  
  // Track if user has typed at least one character in current word
  const hasTypedInCurrentWordRef = useRef(false)
  
  // ===== COMPLETE TEST FUNCTION =====
  const completeTest = useCallback(() => {
    if (isCompleteRef.current) return // Prevent double completion
    
    isCompleteRef.current = true
    
    // Synchronous callback with final stats
    onComplete?.({
      errorCount: errorCountRef.current,
      correctCount: correctCountRef.current,
      totalTyped: totalTypedRef.current,
    })
  }, [onComplete])
  
  // ===== EXPOSE METHODS TO PARENT =====
  useImperativeHandle(ref, () => ({
    handleKeyDown,
    reset,
    getCurrentIndex: () => {
      // Calculate total index for stats
      let total = 0
      for (let i = 0; i < currentWordIndexRef.current; i++) {
        total += wordsArrayRef.current[i].length + 1 // +1 for space
      }
      total += currentCharIndexRef.current
      return total
    },
    getErrorCount: () => errorCountRef.current,
    getCorrectCount: () => correctCountRef.current,
    getTotalTypedCount: () => totalTypedRef.current,
    isComplete: () => isCompleteRef.current,
    focus: () => containerRef.current?.focus(),
  }))

  // ===== PRE-RENDER WORDS ON MOUNT =====
  useEffect(() => {
    if (!textContainerRef.current) return
    
    // Clear previous content
    textContainerRef.current.innerHTML = ''
    wordsDataRef.current = []
    
    // Split text into words
    const words = originalText.split(' ')
    wordsArrayRef.current = words
    
    words.forEach((word, wordIndex) => {
      // Create word container
      const wordSpan = document.createElement('span')
      wordSpan.className = 'word'
      wordSpan.dataset.wordIndex = String(wordIndex)
      
      const chars: HTMLSpanElement[] = []
      const expectedChars = word.split('')
      
      // Add each character
      expectedChars.forEach((char, charIndex) => {
        const charSpan = document.createElement('span')
        charSpan.className = 'char pending'
        charSpan.textContent = char
        charSpan.dataset.charIndex = String(charIndex)
        chars.push(charSpan)
        wordSpan.appendChild(charSpan)
      })
      
      // Create overflow container for extra characters
      const overflowContainer = document.createElement('span')
      overflowContainer.className = 'overflow-container'
      wordSpan.appendChild(overflowContainer)
      
      // Add space after word (except last word)
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span')
        spaceSpan.className = 'word-space'
        spaceSpan.textContent = ' '
        wordSpan.appendChild(spaceSpan)
      }
      
      wordsDataRef.current.push({
        element: wordSpan,
        chars,
        expectedChars,
        overflowChars: [],
        overflowContainer,
      })
      
      textContainerRef.current!.appendChild(wordSpan)
    })
    
    // Position cursor at first word, first char
    updateCursorPosition()
  }, [originalText])

  // ===== O(1) CURSOR POSITION UPDATE =====
  const updateCursorPosition = useCallback(() => {
    if (!cursorRef.current || !containerRef.current) return
    
    const wordData = wordsDataRef.current[currentWordIndexRef.current]
    if (!wordData) return
    
    let targetEl: HTMLSpanElement | null = null
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    
    if (charIndex < wordLength) {
      // Cursor on a normal character
      targetEl = wordData.chars[charIndex]
    } else if (charIndex >= wordLength && wordData.overflowChars.length > 0) {
      // Cursor after overflow characters
      const overflowIndex = charIndex - wordLength
      if (overflowIndex < wordData.overflowChars.length) {
        targetEl = wordData.overflowChars[overflowIndex]
      } else {
        // After all overflow
        targetEl = wordData.overflowChars[wordData.overflowChars.length - 1]
      }
    } else if (charIndex >= wordLength) {
      // Cursor at end of word (no overflow)
      targetEl = wordData.chars[wordLength - 1]
    }
    
    if (targetEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = targetEl.getBoundingClientRect()
      
      const height = charRect.height * 1.1
      const verticalOffset = (height - charRect.height) / 2
      
      // Position at left edge of char, or right edge if at end
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

  // ===== O(1) KEYDOWN HANDLER - WORD-BASED =====
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isCompleteRef.current) return // Freeze typing after completion
    
    const key = e.key
    const wordData = wordsDataRef.current[currentWordIndexRef.current]
    if (!wordData) return
    
    // Handle backspace
    if (key === 'Backspace') {
      handleBackspace(wordData)
      return
    }
    
    // Ignore modifier keys and special keys (except space)
    if (key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    
    // Start timer on first keystroke
    if (!isStartedRef.current) {
      isStartedRef.current = true
      onStart?.()
      if (cursorRef.current) {
        cursorRef.current.classList.remove('typing-cursor')
      }
    }
    
    // Handle space - move to next word
    if (key === ' ') {
      handleSpace(wordData)
      return
    }
    
    // Handle normal character
    handleCharacter(key, wordData)
    
  }, [onStart, onComplete, onType])

  // ===== HANDLE SPACE - FINALIZE WORD =====
  const handleSpace = useCallback((wordData: WordData) => {
    // Only allow space if user has typed at least one character
    if (!hasTypedInCurrentWordRef.current) {
      return // Ignore space at start of word
    }
    
    const wordIndex = currentWordIndexRef.current
    const isLastWord = wordIndex >= wordsArrayRef.current.length - 1
    
    // Mark remaining chars in word as incorrect (skipped)
    const charIndex = currentCharIndexRef.current
    for (let i = charIndex; i < wordData.expectedChars.length; i++) {
      if (wordData.chars[i].className === 'char pending') {
        wordData.chars[i].className = 'char incorrect'
        errorCountRef.current++
        totalTypedRef.current++ // Count skipped chars as typed (errors)
      }
    }
    
    if (isLastWord) {
      // Test complete
      completeTest()
    } else {
      // Move to next word
      currentWordIndexRef.current++
      currentCharIndexRef.current = 0
      hasTypedInCurrentWordRef.current = false // Reset for new word
      updateCursorPosition()
    }
    
    onType?.()
  }, [completeTest, onType, updateCursorPosition])

  // ===== HANDLE CHARACTER =====
  const handleCharacter = useCallback((key: string, wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    const wordIndex = currentWordIndexRef.current
    const isLastWord = wordIndex >= wordsArrayRef.current.length - 1
    
    // Mark that user has typed in this word
    hasTypedInCurrentWordRef.current = true
    totalTypedRef.current++
    
    if (charIndex < wordLength) {
      // Normal character within word bounds
      const expectedChar = wordData.expectedChars[charIndex]
      const charEl = wordData.chars[charIndex]
      
      if (key === expectedChar) {
        charEl.className = 'char correct'
        correctCountRef.current++
      } else {
        charEl.className = 'char incorrect'
        errorCountRef.current++
      }
      
      currentCharIndexRef.current++
      
      // FIX ISSUE 1: Check if this was the last character of the last word
      const isLastCharOfWord = currentCharIndexRef.current >= wordLength
      if (isLastWord && isLastCharOfWord) {
        // Test complete immediately - no space required!
        updateCursorPosition()
        onType?.()
        completeTest()
        return
      }
    } else {
      // Overflow character - beyond word bounds
      const overflowSpan = document.createElement('span')
      overflowSpan.className = 'char overflow'
      overflowSpan.textContent = key
      wordData.overflowContainer.appendChild(overflowSpan)
      wordData.overflowChars.push(overflowSpan)
      errorCountRef.current++
      currentCharIndexRef.current++
    }
    
    updateCursorPosition()
    onType?.()
  }, [completeTest, onType, updateCursorPosition])

  // ===== HANDLE BACKSPACE =====
  const handleBackspace = useCallback((wordData: WordData) => {
    const charIndex = currentCharIndexRef.current
    const wordLength = wordData.expectedChars.length
    
    if (charIndex > wordLength && wordData.overflowChars.length > 0) {
      // Remove overflow character
      const removedChar = wordData.overflowChars.pop()
      if (removedChar) {
        removedChar.remove()
        errorCountRef.current = Math.max(0, errorCountRef.current - 1)
        totalTypedRef.current = Math.max(0, totalTypedRef.current - 1)
      }
      currentCharIndexRef.current--
    } else if (charIndex > 0 && charIndex <= wordLength) {
      // Remove normal character
      currentCharIndexRef.current--
      const charEl = wordData.chars[currentCharIndexRef.current]
      if (charEl) {
        // Adjust counts based on previous state
        if (charEl.className === 'char correct') {
          correctCountRef.current = Math.max(0, correctCountRef.current - 1)
        } else if (charEl.className === 'char incorrect') {
          errorCountRef.current = Math.max(0, errorCountRef.current - 1)
        }
        charEl.className = 'char pending'
        totalTypedRef.current = Math.max(0, totalTypedRef.current - 1)
      }
      
      // If backspaced all chars, reset hasTypedInCurrentWord
      if (currentCharIndexRef.current === 0) {
        hasTypedInCurrentWordRef.current = false
      }
    } else if (charIndex === 0 && currentWordIndexRef.current > 0) {
      // At start of word - go back to previous word
      currentWordIndexRef.current--
      const prevWordData = wordsDataRef.current[currentWordIndexRef.current]
      // Position at end of previous word (after any overflow)
      currentCharIndexRef.current = prevWordData.expectedChars.length + prevWordData.overflowChars.length
      // Previous word must have had typing (otherwise we wouldn't be here)
      hasTypedInCurrentWordRef.current = true
    }
    
    updateCursorPosition()
    onType?.()
  }, [onType, updateCursorPosition])

  // ===== RESET FUNCTION =====
  const reset = useCallback(() => {
    currentWordIndexRef.current = 0
    currentCharIndexRef.current = 0
    errorCountRef.current = 0
    correctCountRef.current = 0
    totalTypedRef.current = 0
    isStartedRef.current = false
    isCompleteRef.current = false
    hasTypedInCurrentWordRef.current = false
    
    // Reset all words
    wordsDataRef.current.forEach((wordData) => {
      // Reset characters
      wordData.chars.forEach((el) => {
        el.className = 'char pending'
      })
      // Clear overflow
      wordData.overflowChars.forEach((el) => el.remove())
      wordData.overflowChars = []
    })
    
    // Reset cursor blink
    if (cursorRef.current) {
      cursorRef.current.classList.add('typing-cursor')
    }
    
    updateCursorPosition()
  }, [updateCursorPosition])

  return (
    <div 
      ref={containerRef} 
      className="typing-container"
    >
      {/* Custom cursor - positioned via direct DOM manipulation */}
      <span
        ref={cursorRef}
        className="typing-cursor cursor-smooth"
        aria-hidden="true"
      />
      
      {/* Text container - words/characters pre-rendered on mount */}
      <div
        ref={textContainerRef}
        className="typing-text"
      />
    </div>
  )
})

TypingDisplay.displayName = 'TypingDisplay'

export default TypingDisplay
