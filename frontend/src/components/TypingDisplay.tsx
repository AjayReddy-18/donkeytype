import React, { useRef, useEffect, useState } from 'react'
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
 * Uses a SINGLE cursor element positioned via CSS transform for smooth performance.
 * No per-character cursor elements = no animation restarts = no lag.
 * 
 * Cursor behavior:
 * - Before typing starts: cursor blinks (inviting the user to type)
 * - During typing: cursor is solid (no distraction)
 */
const TypingDisplay: React.FC<TypingDisplayProps> = ({
  originalText,
  currentIndex,
  charStatuses,
  isTyping = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [cursorStyle, setCursorStyle] = useState<React.CSSProperties>({
    opacity: 0,
    transform: 'translate(0, 0)',
  })

  // Update cursor position when currentIndex changes
  useEffect(() => {
    if (!containerRef.current) return

    // Get the character element at the current index
    const charEl = charRefs.current[currentIndex]
    
    if (charEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = charEl.getBoundingClientRect()
      
      // Position cursor at the LEFT edge of the current character
      // Make cursor slightly taller than the character (5%) and center it vertically
      const cursorHeight = charRect.height * 1.05
      const verticalOffset = (cursorHeight - charRect.height) / 2
      
      const left = charRect.left - containerRect.left
      const top = charRect.top - containerRect.top - verticalOffset
      
      setCursorStyle({
        opacity: 1,
        transform: `translate(${left}px, ${top}px)`,
        height: `${cursorHeight}px`,
      })
    } else if (currentIndex >= originalText.length) {
      // Cursor at the end - position after the last character
      const lastCharEl = charRefs.current[originalText.length - 1]
      if (lastCharEl) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const charRect = lastCharEl.getBoundingClientRect()
        
        const cursorHeight = charRect.height * 1.05
        const verticalOffset = (cursorHeight - charRect.height) / 2
        
        const left = charRect.right - containerRect.left
        const top = charRect.top - containerRect.top - verticalOffset
        
        setCursorStyle({
          opacity: 1,
          transform: `translate(${left}px, ${top}px)`,
          height: `${cursorHeight}px`,
        })
      }
    } else {
      // No valid position, hide cursor
      setCursorStyle({ opacity: 0, transform: 'translate(0, 0)' })
    }
  }, [currentIndex, originalText.length])

  // Build character elements
  const words = originalText.split(' ')
  let charIndex = 0
  
  const renderedContent = words.map((word, wordIndex) => {
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

    // Space after word (except last)
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

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Single cursor element - positioned via transform for smooth movement */}
      {/* Cursor blinks when idle, solid when typing (Monkeytype-style) */}
      <span
        className={isTyping ? '' : 'typing-cursor'}
        style={{
          position: 'absolute',
          left: 0,
          width: '3px',
          backgroundColor: 'var(--color-primary)',
          borderRadius: '2px',
          pointerEvents: 'none',
          willChange: 'transform',
          ...cursorStyle,
        }}
        aria-hidden="true"
      />
      
      {/* Text content */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
          lineHeight: '2.2',
          letterSpacing: '0.02em',
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
