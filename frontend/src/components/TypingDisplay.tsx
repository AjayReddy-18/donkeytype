import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * TypingDisplay - Monkeytype-style word-based typing display
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
 * - Pre-renders ALL words/characters on mount
 * - Keystrokes ONLY toggle CSS classes
 * - No React state updates during typing
 */

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
  
  // Word-based data structure
  const wordsDataRef = useRef<WordData[]>([])
  const wordsArrayRef = useRef<string[]>([])
  
  // ===== PERMANENT STATS - NEVER DECREMENTED BY BACKSPACE =====
  // These track the HISTORICAL typing record, not just current state
  const totalKeystrokesRef = useRef(0)      // Every character typed
  const correctKeystrokesRef = useRef(0)    // Correct characters typed
  const incorrectKeystrokesRef = useRef(0)  // Incorrect + overflow characters
  
  // ===== CURSOR/POSITION STATE =====
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
  
  // ===== EXPOSE METHODS TO PARENT =====
  useImperativeHandle(ref, () => ({
    handleKeyDown,
    reset,
    getCurrentIndex: () => {
      let total = 0
      for (let i = 0; i < currentWordIndexRef.current; i++) {
        total += wordsArrayRef.current[i].length + 1
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
  }))

  // ===== PRE-RENDER WORDS ON MOUNT =====
  useEffect(() => {
    if (!textContainerRef.current) return
    
    textContainerRef.current.innerHTML = ''
    wordsDataRef.current = []
    
    const words = originalText.split(' ')
    wordsArrayRef.current = words
    
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span')
      wordSpan.className = 'word'
      wordSpan.dataset.wordIndex = String(wordIndex)
      
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

  // ===== O(1) KEYDOWN HANDLER =====
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isCompleteRef.current) return
    
    const key = e.key
    const wordData = wordsDataRef.current[currentWordIndexRef.current]
    if (!wordData) return
    
    if (key === 'Backspace') {
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
    
  }, [onStart, onComplete, onType])

  // ===== HANDLE SPACE - FINALIZE WORD =====
  const handleSpace = useCallback((wordData: WordData) => {
    if (!hasTypedInCurrentWordRef.current) {
      return // Ignore space at start of word
    }
    
    const wordIndex = currentWordIndexRef.current
    const isLastWord = wordIndex >= wordsArrayRef.current.length - 1
    
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
    } else if (charIndex === 0 && currentWordIndexRef.current > 0) {
      currentWordIndexRef.current--
      const prevWordData = wordsDataRef.current[currentWordIndexRef.current]
      currentCharIndexRef.current = prevWordData.expectedChars.length + prevWordData.overflowChars.length
      hasTypedInCurrentWordRef.current = true
    }
    
    updateCursorPosition()
    onType?.()
  }, [onType, updateCursorPosition])

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
    
    // Reset visual state
    wordsDataRef.current.forEach((wordData) => {
      wordData.chars.forEach((el) => {
        el.className = 'char pending'
      })
      wordData.overflowChars.forEach((el) => el.remove())
      wordData.overflowChars = []
    })
    
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
