import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTypingText, submitResult } from '../services/api'
import { TypingTextResponse } from '../types/api'
import TypingDisplay from '../components/TypingDisplay'
import StatsDisplay from '../components/StatsDisplay'
import {
  compareText,
  calculateWpm,
  getCharStatuses,
  CharStatus,
} from '../utils/typingEngine'

const Practice = () => {
  const { user, isAuthenticated } = useAuth()
  const [textData, setTextData] = useState<TypingTextResponse | null>(null)
  const [typedText, setTypedText] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 0,
    totalErrors: 0,
  })
  const [charStatuses, setCharStatuses] = useState<CharStatus[]>([])
  const [allErrors, setAllErrors] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [lastTypingTime, setLastTypingTime] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch new text on mount
  useEffect(() => {
    loadNewText()
  }, [])

  // Timer effect
  useEffect(() => {
    if (isStarted && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isStarted, isCompleted])

  // Update stats when typing
  useEffect(() => {
    if (textData && typedText.length > 0) {
      const comparison = compareText(textData.text, typedText, allErrors)
      const wpm = calculateWpm(typedText.length, timeSeconds || 1)
      setStats({
        wpm,
        accuracy: comparison.accuracy,
        totalErrors: comparison.totalErrors,
      })
      setCharStatuses(getCharStatuses(textData.text, typedText, typedText.length))
    }
  }, [typedText, textData, timeSeconds, allErrors])

  // Check for completion
  useEffect(() => {
    if (textData && typedText === textData.text && !isCompleted) {
      setIsCompleted(true)
      setShowControls(true)
      const finalComparison = compareText(textData.text, typedText, allErrors)
      const finalWpm = calculateWpm(typedText.length, timeSeconds || 1)

      if (user) {
        submitResult(user.id, {
          wpm: finalWpm,
          accuracy: finalComparison.accuracy,
          totalErrors: finalComparison.totalErrors,
          timeSeconds,
        }).catch((error) => {
          console.error('Failed to submit result:', error)
        })
      }
    }
  }, [typedText, textData, isCompleted, timeSeconds, user, allErrors])

  // Monitor typing activity to show/hide controls
  useEffect(() => {
    if (isStarted && !isCompleted) {
      setShowControls(false)
      setLastTypingTime(Date.now())
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to show controls after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setShowControls(true)
      }, 2000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [typedText, isStarted, isCompleted])

  const loadNewText = async () => {
    try {
      const data = await getTypingText()
      setTextData(data)
      setTypedText('')
      setIsStarted(false)
      setIsCompleted(false)
      setTimeSeconds(0)
      setStats({ wpm: 0, accuracy: 0, totalErrors: 0 })
      setCharStatuses([])
      setAllErrors(0)
      setCurrentWordIndex(0)
      setShowControls(true)
    } catch (error) {
      console.error('Failed to load text:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!isStarted && value.length > 0) {
      setIsStarted(true)
    }

    if (textData) {
      const newLength = value.length
      const oldLength = typedText.length
      
      if (newLength > oldLength) {
        const newChar = value[newLength - 1]
        const expectedChar = textData.text[newLength - 1]
        
        if (newChar !== expectedChar) {
          setAllErrors((prev) => prev + 1)
        }
      }
    }

    setTypedText(value)
    setLastTypingTime(Date.now())

    if (textData) {
      const words = textData.text.split(' ')
      let charCount = 0
      for (let i = 0; i < words.length; i++) {
        const wordEnd = charCount + words[i].length
        if (value.length <= wordEnd + i) {
          setCurrentWordIndex(i)
          break
        }
        charCount = wordEnd
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && typedText.length === 0) {
      e.preventDefault()
    }
    
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        loadNewText()
      }
    }
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      loadNewText()
    }
    
    if (e.key === 'k' && e.ctrlKey && e.shiftKey) {
      e.preventDefault()
      handleReset()
    }
  }

  const handleReset = () => {
    if (textData) {
      setTypedText('')
      setIsStarted(false)
      setIsCompleted(false)
      setTimeSeconds(0)
      setStats({ wpm: 0, accuracy: 0, totalErrors: 0 })
      setCharStatuses([])
      setAllErrors(0)
      setCurrentWordIndex(0)
      setShowControls(true)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  if (!textData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-gray-400 text-xl">Loading text...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Stats Bar */}
      <div className="bg-[#252525] border-b border-[#333]">
        <div className="max-w-[95%] mx-auto px-6 py-5">
          <StatsDisplay
            wpm={stats.wpm}
            accuracy={stats.accuracy}
            totalErrors={stats.totalErrors}
            timeSeconds={timeSeconds}
          />
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 w-full">
        <div className="w-full max-w-[90%]">
          {/* Guest Mode Banner - Only show when not started */}
          {!isAuthenticated && !isStarted && !isCompleted && (
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-gray-300">Practicing as a guest.</span>
                {' '}Your results won't be saved.{' '}
                <Link to="/register" className="text-[#60a5fa] hover:text-[#93c5fd] font-semibold underline">
                  Register
                </Link>
                {' '}to track your progress!
              </p>
            </div>
          )}

          {/* Typing Display - Much Larger */}
          <div className="relative mb-8">
            <div 
              className="bg-[#252525] rounded-lg shadow-2xl p-16 min-h-[350px] flex items-center cursor-text border border-[#333]"
              onClick={() => inputRef.current?.focus()}
            >
              <TypingDisplay
                originalText={textData.text}
                typedText={typedText}
                currentIndex={typedText.length}
                charStatuses={charStatuses}
              />
            </div>
            
            {/* Hidden Input */}
            <input
              ref={inputRef}
              type="text"
              value={typedText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isCompleted}
              className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          
          {/* Placeholder text when not started */}
          {!isStarted && typedText.length === 0 && (
            <div className="text-center text-gray-500 text-lg mb-8">
              Click on the text above or start typing to begin...
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="mt-6 bg-[#1e3a1e] border border-[#2d5a2d] rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-[#4ade80] mb-2">Test Completed!</h2>
              {isAuthenticated ? (
                <p className="text-[#86efac]">
                  Your result has been saved. Great job!
                </p>
              ) : (
                <>
                  <p className="text-[#86efac] mb-3">
                    Great job! Your results are not being saved.
                  </p>
                  <p className="text-sm text-gray-400">
                    <Link to="/register" className="text-[#60a5fa] hover:text-[#93c5fd] font-semibold">
                      Create an account
                    </Link>
                    {' '}to save your progress and compete on the leaderboard!
                  </p>
                </>
              )}
            </div>
          )}

          {/* Control Buttons - Show on hover or after inactivity */}
          <div 
            className={`mt-6 flex justify-center space-x-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={handleReset}
              className="group relative px-6 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] font-medium border border-[#3a3a3a] hover:border-[#4a4a4a] transition-all"
              title="Reset (Ctrl + Shift + K)"
            >
              <span>Reset</span>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-xs text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#333]">
                Ctrl + Shift + K
              </span>
            </button>
            <button
              onClick={loadNewText}
              className="group relative px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] font-medium transition-all"
              title="New Test (Ctrl + Enter)"
            >
              <span>New Test</span>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-xs text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#333]">
                Ctrl + Enter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Practice
