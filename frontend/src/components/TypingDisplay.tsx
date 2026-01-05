import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

/**
 * TypingDisplay - Ultra-optimized Monkeytype-style typing display
 * 
 * PERFORMANCE ARCHITECTURE:
 * - Pre-renders ALL characters as DOM nodes on mount (not on keystroke)
 * - Keystrokes ONLY toggle CSS classes - zero React re-renders
 * - Cursor position updated via direct DOM manipulation
 * - Stats calculated on interval (not per-keystroke)
 * - Zero string building, innerHTML changes, or framework updates during typing
 * 
 * This achieves O(1) constant-time work per keystroke.
 */

export interface TypingDisplayHandle {
  handleKeyDown: (e: KeyboardEvent) => void
  reset: () => void
  getCurrentIndex: () => number
  getErrorCount: () => number
  isComplete: () => boolean
  focus: () => void
}

interface TypingDisplayProps {
  originalText: string
  onStart?: () => void
  onComplete?: (stats: { errorCount: number; correctCount: number }) => void
  onType?: () => void // Called on any keystroke for activity detection
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
  const charElementsRef = useRef<HTMLSpanElement[]>([])
  
  // Typing state stored in refs (NOT React state)
  const currentIndexRef = useRef(0)
  const errorCountRef = useRef(0)
  const correctCountRef = useRef(0)
  const isStartedRef = useRef(false)
  const isCompleteRef = useRef(false)
  
  // ===== EXPOSE METHODS TO PARENT =====
  useImperativeHandle(ref, () => ({
    handleKeyDown,
    reset,
    getCurrentIndex: () => currentIndexRef.current,
    getErrorCount: () => errorCountRef.current,
    isComplete: () => isCompleteRef.current,
    focus: () => containerRef.current?.focus(),
  }))

  // ===== PRE-RENDER CHARACTERS ON MOUNT =====
  useEffect(() => {
    if (!textContainerRef.current) return
    
    // Clear previous content
    textContainerRef.current.innerHTML = ''
    charElementsRef.current = []
    
    // Pre-render ALL characters as individual spans
    const words = originalText.split(' ')
    let charIndex = 0
    
    words.forEach((word, wordIndex) => {
      // Create word container for proper wrapping
      const wordSpan = document.createElement('span')
      wordSpan.className = 'inline-block whitespace-nowrap'
      
      // Add each character
      word.split('').forEach((char) => {
        const charSpan = document.createElement('span')
        charSpan.className = 'char pending'
        charSpan.textContent = char
        charSpan.dataset.index = String(charIndex)
        charElementsRef.current[charIndex] = charSpan
        wordSpan.appendChild(charSpan)
        charIndex++
      })
      
      // Add space after word (except last word)
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span')
        spaceSpan.className = 'char pending'
        spaceSpan.textContent = '\u00A0' // non-breaking space
        spaceSpan.dataset.index = String(charIndex)
        charElementsRef.current[charIndex] = spaceSpan
        wordSpan.appendChild(spaceSpan)
        charIndex++
      }
      
      textContainerRef.current!.appendChild(wordSpan)
    })
    
    // Position cursor at start
    updateCursorPosition(0)
  }, [originalText])

  // ===== O(1) CURSOR POSITION UPDATE =====
  const updateCursorPosition = useCallback((index: number) => {
    if (!cursorRef.current || !containerRef.current) return
    
    const charEl = charElementsRef.current[index]
    if (charEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = charEl.getBoundingClientRect()
      
      const height = charRect.height * 1.05
      const verticalOffset = (height - charRect.height) / 2
      const left = charRect.left - containerRect.left
      const top = charRect.top - containerRect.top - verticalOffset
      
      // Direct style manipulation - no React involved
      cursorRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`
      cursorRef.current.style.height = `${height}px`
      cursorRef.current.style.opacity = '1'
    } else if (index >= originalText.length) {
      // Position at end
      const lastCharEl = charElementsRef.current[originalText.length - 1]
      if (lastCharEl) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const charRect = lastCharEl.getBoundingClientRect()
        
        const height = charRect.height * 1.05
        const verticalOffset = (height - charRect.height) / 2
        const left = charRect.right - containerRect.left
        const top = charRect.top - containerRect.top - verticalOffset
        
        cursorRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`
        cursorRef.current.style.height = `${height}px`
        cursorRef.current.style.opacity = '1'
      }
    }
  }, [originalText.length])

  // ===== O(1) KEYDOWN HANDLER - THE CORE OPTIMIZATION =====
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isCompleteRef.current) return
    
    const key = e.key
    
    // Handle backspace
    if (key === 'Backspace') {
      if (currentIndexRef.current > 0) {
        currentIndexRef.current--
        const charEl = charElementsRef.current[currentIndexRef.current]
        if (charEl) {
          // O(1) class toggle - no re-render
          charEl.className = 'char pending'
        }
        updateCursorPosition(currentIndexRef.current)
        onType?.()
      }
      return
    }
    
    // Ignore modifier keys and special keys
    if (key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    
    // Start timer on first keystroke
    if (!isStartedRef.current) {
      isStartedRef.current = true
      onStart?.()
      // Remove blink class from cursor
      if (cursorRef.current) {
        cursorRef.current.classList.remove('typing-cursor')
      }
    }
    
    const index = currentIndexRef.current
    if (index >= originalText.length) return
    
    const expectedChar = originalText[index]
    const charEl = charElementsRef.current[index]
    
    if (charEl) {
      // O(1) class toggle - THE KEY OPTIMIZATION
      if (key === expectedChar) {
        charEl.className = 'char correct'
        correctCountRef.current++
      } else {
        charEl.className = 'char incorrect'
        errorCountRef.current++
      }
    }
    
    currentIndexRef.current++
    updateCursorPosition(currentIndexRef.current)
    onType?.()
    
    // Check completion
    if (currentIndexRef.current >= originalText.length) {
      isCompleteRef.current = true
      onComplete?.({
        errorCount: errorCountRef.current,
        correctCount: correctCountRef.current,
      })
    }
  }, [originalText, onStart, onComplete, onType, updateCursorPosition])

  // ===== RESET FUNCTION =====
  const reset = useCallback(() => {
    currentIndexRef.current = 0
    errorCountRef.current = 0
    correctCountRef.current = 0
    isStartedRef.current = false
    isCompleteRef.current = false
    
    // Reset all character classes
    charElementsRef.current.forEach((el) => {
      if (el) el.className = 'char pending'
    })
    
    // Reset cursor
    if (cursorRef.current) {
      cursorRef.current.classList.add('typing-cursor')
    }
    
    updateCursorPosition(0)
  }, [updateCursorPosition])

  return (
    <div 
      ref={containerRef} 
      className="relative w-full outline-none"
      tabIndex={0}
    >
      {/* Cursor - positioned via direct DOM manipulation */}
      <span
        ref={cursorRef}
        className="typing-cursor cursor-smooth"
        style={{
          position: 'absolute',
          left: 0,
          width: '3px',
          backgroundColor: 'var(--color-primary)',
          borderRadius: '2px',
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden="true"
      />
      
      {/* Text container - characters pre-rendered on mount */}
      <div
        ref={textContainerRef}
        className="typing-text"
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)',
          lineHeight: '2',
          letterSpacing: 'normal',
          fontWeight: 500,
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
          textAlign: 'left',
        }}
      />
    </div>
  )
})

TypingDisplay.displayName = 'TypingDisplay'

export default TypingDisplay
