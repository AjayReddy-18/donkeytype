import { CharStatus } from '../utils/typingEngine'

interface TypingDisplayProps {
  originalText: string
  typedText: string
  currentIndex: number
  charStatuses: CharStatus[]
}

const TypingDisplay: React.FC<TypingDisplayProps> = ({
  originalText,
  typedText,
  currentIndex,
  charStatuses,
}) => {
  const renderChar = (char: string, index: number, status: CharStatus) => {
    let className = 'font-mono text-3xl leading-relaxed transition-colors'
    
    if (status === 'correct') {
      // Completed characters - subtle gray
      className += ' text-gray-500'
    } else if (status === 'incorrect') {
      // Incorrect characters - red with background
      className += ' text-[#f87171] bg-[#4a1a1a]'
    } else if (status === 'current') {
      // Current character - highlighted with cursor
      className += ' text-white bg-[#3b82f6] relative'
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
          <span className="absolute left-0 top-0 w-0.5 h-8 bg-white animate-blink"></span>
        </span>
      )
    } else {
      // Pending characters - dark gray
      className += ' text-gray-600'
    }

    // Handle spaces with proper wrapping
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

  return (
    <div className="w-full">
      <div 
        className="font-mono text-3xl leading-relaxed"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          textAlign: 'left',
        }}
      >
        {originalText.split('').map((char, index) => {
          const status = charStatuses[index] || 'pending'
          return renderChar(char, index, status)
        })}
      </div>
    </div>
  )
}

export default TypingDisplay
