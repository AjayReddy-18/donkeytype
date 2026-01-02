import React, { useMemo } from 'react'
import { CharStatus } from '../utils/typingEngine'

interface TypingDisplayProps {
  originalText: string
  typedText: string
  currentIndex: number
  charStatuses: CharStatus[]
}

/**
 * TypingDisplay - Monkeytype-style typing display
 * Optimized for smooth performance with minimal re-renders
 */
const TypingDisplay: React.FC<TypingDisplayProps> = ({
  originalText,
  charStatuses,
}) => {
  // Memoize the character rendering to prevent unnecessary recalculations
  const renderedContent = useMemo(() => {
    const words = originalText.split(' ')
    let charIndex = 0

    return words.map((word, wordIndex) => {
      const wordChars = word.split('').map((char) => {
        const idx = charIndex++
        const status = charStatuses[idx] || 'pending'
        const isCurrent = status === 'current'
        const displayChar = char === ' ' ? '\u00A0' : char

        // Direct color assignment - no class lookups
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

        // Keep the caret element mounted at all times (only change opacity).
        // This prevents the blink animation from restarting every keystroke,
        // which feels like \"lag\" compared to Monkeytype.
        return (
          <span key={idx} style={{ color, position: 'relative' }}>
            {isCurrent && (
              <span
                className="animate-cursor-blink"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '10%',
                  height: '80%',
                  width: '2px',
                  backgroundColor: 'var(--color-primary)',
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />
            )}
            {displayChar}
          </span>
        )
      })

      // Space after word (except last)
      const spaceIdx = charIndex++
      const spaceStatus = charStatuses[spaceIdx] || 'pending'
      const spaceIsCurrent = spaceStatus === 'current'
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
        <span key={`space-${spaceIdx}`} style={{ color: spaceColor, position: 'relative' }}>
          {spaceIsCurrent && (
            <span
              className="animate-cursor-blink"
              style={{
                position: 'absolute',
                left: 0,
                top: '10%',
                height: '80%',
                width: '2px',
                backgroundColor: 'var(--color-primary)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          )}
          {'\u00A0'}
        </span>
      ) : null

      return (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {wordChars}
          {spaceSpan}
        </span>
      )
    })
  }, [originalText, charStatuses])

  return (
    <div className="w-full no-transition">
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
          lineHeight: '2',
          letterSpacing: '0.05em',
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
