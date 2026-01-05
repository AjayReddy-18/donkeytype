import React, { useRef, useEffect, useState, useMemo } from 'react'
import { CharStatus } from '../utils/typingEngine'

interface TypingDisplayProps {
  originalText: string
  typedText: string
  currentIndex: number
  charStatuses: CharStatus[]
  isTyping?: boolean // When true, cursor stops blinking (solid line)
}

/**
 * TypingDisplay - Monkeytype-style typing display
 * 
 * Optimizations for smooth cursor movement:
 * 1. Single cursor element with CSS transitions (no DOM manipulation)
 * 2. GPU-accelerated transform3d positioning
 * 3. Optimized font rendering (Roboto Mono like Monkeytype)
 * 4. Memoized character rendering to prevent unnecessary re-renders
 * 5. CSS containment for layout stability
 * 
 * Cursor behavior:
 * - Before typing: blinks to invite user
 * - During typing: solid line that glides smoothly
 */
const TypingDisplay: React.FC<TypingDisplayProps> = ({
  originalText,
  currentIndex,
  charStatuses,
  isTyping = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [cursorTransform, setCursorTransform] = useState('translate3d(0, 0, 0)')
  const [cursorHeight, setCursorHeight] = useState('1.5em')
  const [cursorOpacity, setCursorOpacity] = useState(0)

  // Update cursor position when currentIndex changes
  useEffect(() => {
    if (!containerRef.current) return

    const charEl = charRefs.current[currentIndex]
    
    if (charEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = charEl.getBoundingClientRect()
      
      const height = charRect.height * 1.05
      const verticalOffset = (height - charRect.height) / 2
      const left = charRect.left - containerRect.left
      const top = charRect.top - containerRect.top - verticalOffset
      
      setCursorTransform(`translate3d(${left}px, ${top}px, 0)`)
      setCursorHeight(`${height}px`)
      setCursorOpacity(1)
    } else if (currentIndex >= originalText.length) {
      const lastCharEl = charRefs.current[originalText.length - 1]
      if (lastCharEl) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const charRect = lastCharEl.getBoundingClientRect()
        
        const height = charRect.height * 1.05
        const verticalOffset = (height - charRect.height) / 2
        const left = charRect.right - containerRect.left
        const top = charRect.top - containerRect.top - verticalOffset
        
        setCursorTransform(`translate3d(${left}px, ${top}px, 0)`)
        setCursorHeight(`${height}px`)
        setCursorOpacity(1)
      }
    } else {
      setCursorOpacity(0)
    }
  }, [currentIndex, originalText.length])

  // Memoize character rendering for performance
  const renderedContent = useMemo(() => {
    const words = originalText.split(' ')
    let charIndex = 0
    
    return words.map((word, wordIndex) => {
      const wordChars = word.split('').map((char) => {
        const idx = charIndex++
        const status = charStatuses[idx] || 'pending'
        const displayChar = char === ' ' ? '\u00A0' : char

        let color: string
        switch (status) {
          case 'correct':
            color = 'var(--color-text)'
            break
          case 'incorrect':
            color = 'var(--color-accent-error)'
            break
          default:
            color = 'var(--color-text-muted)'
        }

        return (
          <span
            key={idx}
            ref={(el) => { charRefs.current[idx] = el }}
            style={{ color }}
          >
            {displayChar}
          </span>
        )
      })

      const spaceIdx = charIndex++
      const spaceStatus = charStatuses[spaceIdx] || 'pending'
      let spaceColor: string
      switch (spaceStatus) {
        case 'correct':
          spaceColor = 'var(--color-text)'
          break
        case 'incorrect':
          spaceColor = 'var(--color-accent-error)'
          break
        default:
          spaceColor = 'var(--color-text-muted)'
      }

      const spaceSpan = wordIndex < words.length - 1 ? (
        <span
          key={`space-${spaceIdx}`}
          ref={(el) => { charRefs.current[spaceIdx] = el }}
          style={{ color: spaceColor }}
        >
          {'\u00A0'}
        </span>
      ) : null

      return (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {wordChars}
          {spaceSpan}
        </span>
      )
    })
  }, [originalText, charStatuses])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Smooth cursor - CSS transition handles the animation */}
      <span
        className={isTyping ? 'cursor-smooth' : 'typing-cursor cursor-smooth'}
        style={{
          position: 'absolute',
          left: 0,
          width: '3px',
          height: cursorHeight,
          backgroundColor: 'var(--color-primary)',
          borderRadius: '2px',
          pointerEvents: 'none',
          opacity: cursorOpacity,
          transform: cursorTransform,
        }}
        aria-hidden="true"
      />
      
      {/* Text content - optimized for smooth rendering */}
      <div
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
      >
        {renderedContent}
      </div>
    </div>
  )
}

export default React.memo(TypingDisplay)
