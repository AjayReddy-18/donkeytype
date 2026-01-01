import React from 'react'
import { CharStatus } from '../utils/typingEngine'

interface TypingDisplayProps {
  originalText: string
  typedText: string
  currentIndex: number
  charStatuses: CharStatus[]
}

const TypingDisplay: React.FC<TypingDisplayProps> = ({
  originalText,
  charStatuses,
}) => {
  const renderChar = (char: string, index: number, status: CharStatus) => {
    let className = 'font-mono text-3xl leading-relaxed transition-colors'
    
    if (status === 'correct') {
      className += ' text-[#8b949e]'
    } else if (status === 'incorrect') {
      className += ' text-[#f85149]'
    } else if (status === 'current') {
      className += ' text-[#c9d1d9] relative'
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
          <span className="absolute left-0 bottom-0 w-full h-0.5 bg-[#58a6ff] animate-blink"></span>
        </span>
      )
    } else {
      className += ' text-[#30363d]'
    }

    if (char === ' ') {
      return (
        <span key={index} className={className}>
          {'\u00A0'}
        </span>
      )
    }

    return (
      <span key={index} className={className}>
        {char}
      </span>
    )
  }

  // Split text into words for proper wrapping
  const words = originalText.split(' ')
  let charIndex = 0

  return (
    <div className="w-full">
      <div 
        className="font-mono text-3xl leading-relaxed"
        style={{
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
          textAlign: 'left',
        }}
      >
        {words.map((word, wordIndex) => {
          const wordChars = word.split('')
          const wordSpans = wordChars.map((char) => {
            const globalIndex = charIndex++
            const status = charStatuses[globalIndex] || 'pending'
            return renderChar(char, globalIndex, status)
          })
          
          // Add space after word (except last word)
          const spaceIndex = charIndex++
          const spaceStatus = charStatuses[spaceIndex] || 'pending'
          const spaceChar = wordIndex < words.length - 1 ? renderChar(' ', spaceIndex, spaceStatus) : null
          
          return (
            <span 
              key={wordIndex} 
              style={{ whiteSpace: 'nowrap', display: 'inline-block' }}
            >
              {wordSpans}
              {spaceChar}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default TypingDisplay
