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
  const [showControls, setShowControls] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isCompletedRef = useRef(false) // Ref to track completion synchronously
  const completedValueRef = useRef<string>('') // Ref to store the completed value
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

  // Update stats when typing (but don't display until completion)
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

  // Check for completion (backup check, but primary check is in handleInputChange)
  useEffect(() => {
    if (textData && typedText.length >= textData.text.length && !isCompleted && !isCompletedRef.current) {
      // This is a backup - primary completion check happens in handleInputChange
      // But we keep this for edge cases
      // Set refs immediately to prevent race conditions
      isCompletedRef.current = true
      completedValueRef.current = typedText.slice(0, textData.text.length)
      
      const finalTyped = typedText.slice(0, textData.text.length)
      const finalComparison = compareText(textData.text, finalTyped, allErrors)
      const finalWpm = calculateWpm(finalTyped.length, timeSeconds || 1)
      
      setStats({
        wpm: finalWpm,
        accuracy: finalComparison.accuracy,
        totalErrors: finalComparison.totalErrors,
      })
      
      setIsCompleted(true)
      setShowControls(true)
      
      // Disable input
      if (inputRef.current) {
        inputRef.current.disabled = true
        inputRef.current.readOnly = true
      }

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
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
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
      // Reset refs immediately
      isCompletedRef.current = false
      completedValueRef.current = ''
      const data = await getTypingText()
      setTextData(data)
      setTypedText('')
      setIsStarted(false)
      setIsCompleted(false)
      setTimeSeconds(0)
      setStats({ wpm: 0, accuracy: 0, totalErrors: 0 })
      setCharStatuses([])
      setAllErrors(0)
      setShowControls(true)
      // Re-enable input when loading new text
      if (inputRef.current) {
        inputRef.current.disabled = false
        inputRef.current.readOnly = false
        inputRef.current.value = ''
        inputRef.current.focus()
      }
    } catch (error) {
      console.error('Failed to load text:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check ref first for immediate synchronous check (avoids race conditions)
    // If completed, DO NOT update state - this keeps the input value locked
    if (isCompletedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Also check state (for React re-renders)
    if (isCompleted) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Clamp input to the target length (handles paste / fast key repeats)
    const rawValue = e.target.value
    const value =
      textData && rawValue.length > textData.text.length
        ? rawValue.slice(0, textData.text.length)
        : rawValue
    
    // Check for completion FIRST - end the test once the user reaches the end,
    // even if there are mistakes (Monkeytype-style).
    if (textData && value.length >= textData.text.length && !isCompletedRef.current) {
      // Set ref immediately to prevent any further processing
      isCompletedRef.current = true
      completedValueRef.current = value // Store the completed value
      
      // Calculate and set final stats synchronously
      const finalComparison = compareText(textData.text, value, allErrors)
      const finalWpm = calculateWpm(value.length, timeSeconds || 1)
      
      setStats({
        wpm: finalWpm,
        accuracy: finalComparison.accuracy,
        totalErrors: finalComparison.totalErrors,
      })
      
      // Set completion state immediately
      setIsCompleted(true)
      setShowControls(true)
      
      // Disable the input immediately
      if (inputRef.current) {
        inputRef.current.disabled = true
        inputRef.current.readOnly = true
      }
      
      // Submit result if authenticated
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
      
      // Set typed text to the completed value - this is the LAST state update
      // After this, no more state updates will happen, locking the value
      setTypedText(value)
      
      // Prevent default and stop propagation to block any further events
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
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

    // Only update state if not completed
    if (!isCompletedRef.current) setTypedText(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check ref first for immediate synchronous check
    if (isCompletedRef.current) {
      // Allow shortcuts for reset and new test even when completed
      if (e.key === 'Tab' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        loadNewText()
        return
      }
      
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        loadNewText()
        return
      }
      
      if (e.key === 'k' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        handleReset()
        return
      }
      
      // Prevent all other keys when completed (including backspace)
      e.preventDefault()
      return
    }
    
    // Also check state
    if (isCompleted) {
      // Allow shortcuts for reset and new test even when completed
      if (e.key === 'Tab' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        loadNewText()
        return
      }
      
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        loadNewText()
        return
      }
      
      if (e.key === 'k' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        handleReset()
        return
      }
      
      // Prevent all other keys when completed (including backspace)
      e.preventDefault()
      return
    }
    
    // Prevent backspace when at the start
    if (e.key === 'Backspace' && typedText.length === 0) {
      e.preventDefault()
      return
    }
    
    // Prevent typing beyond the expected text length
    // Check the actual input value, not the state (which might be stale)
    if (textData && inputRef.current && e.key !== 'Backspace') {
      const currentLength = inputRef.current.value.length
      if (currentLength >= textData.text.length) {
        e.preventDefault()
        return
      }
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
      // Reset refs immediately
      isCompletedRef.current = false
      completedValueRef.current = ''
      setTypedText('')
      setIsStarted(false)
      setIsCompleted(false)
      setTimeSeconds(0)
      setStats({ wpm: 0, accuracy: 0, totalErrors: 0 })
      setCharStatuses([])
      setAllErrors(0)
      setShowControls(true)
      if (inputRef.current) {
        inputRef.current.disabled = false // Re-enable input
        inputRef.current.readOnly = false // Re-enable input
        inputRef.current.value = '' // Clear the value
        inputRef.current.focus()
      }
    }
  }

  if (!textData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <p className="text-[#c9d1d9] text-xl">Loading text...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 w-full">
        {isCompleted ? (
          // Show centered stats after completion
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[#58a6ff] mb-8">Test Completed!</h2>
              <StatsDisplay
                wpm={stats.wpm}
                accuracy={stats.accuracy}
                totalErrors={stats.totalErrors}
                timeSeconds={timeSeconds}
              />
              {!isAuthenticated && (
                <p className="mt-6 text-sm text-[#8b949e]">
                  <Link to="/login" className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold underline">
                    Create an account
                  </Link>
                  {' '}to save your progress and compete on the leaderboard!
                </p>
              )}
            </div>
            
            {/* Control Links */}
            <div className="flex justify-center space-x-6 mt-8">
              <button
                onClick={handleReset}
                className="group relative text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium transition-all"
                title="Reset (Ctrl + Shift + K)"
              >
                Reset
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0d1117] text-xs text-[#8b949e] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#21262d]">
                  Ctrl + Shift + K
                </span>
              </button>
              <button
                onClick={loadNewText}
                className="group relative text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium transition-all"
                title="New Test (Ctrl + Enter)"
              >
                New Test
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0d1117] text-xs text-[#8b949e] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#21262d]">
                  Ctrl + Enter
                </span>
              </button>
            </div>
          </div>
        ) : (
          // Show typing interface
          <div className="w-full max-w-[90%]">
            {/* Guest Mode Message - Plain text, no box */}
            {!isAuthenticated && !isStarted && (
              <div className="text-center mb-6">
                <p className="text-sm text-[#8b949e]">
                  <span className="font-semibold text-[#c9d1d9]">Practicing as a guest.</span>
                  {' '}Your results won't be saved.{' '}
                  <Link to="/login" className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold underline">
                    Login
                  </Link>
                  {' '}to track your progress!
                </p>
              </div>
            )}

            {/* Typing Display - No Box, Direct on Page */}
            <div className="relative mb-8">
              <div 
                className="p-8 min-h-[300px] flex items-center cursor-text"
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
                readOnly={isCompleted}
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
              <div className="text-center text-[#8b949e] text-lg mb-8">
                Click on the text above or start typing to begin...
              </div>
            )}

            {/* Control Links - Show on hover or after inactivity */}
            <div 
              className={`mt-6 flex justify-center space-x-6 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={handleReset}
                className="group relative text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium transition-all"
                title="Reset (Ctrl + Shift + K)"
              >
                Reset
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0d1117] text-xs text-[#8b949e] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#21262d]">
                  Ctrl + Shift + K
                </span>
              </button>
              <button
                onClick={loadNewText}
                className="group relative text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium transition-all"
                title="New Test (Ctrl + Enter)"
              >
                New Test
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0d1117] text-xs text-[#8b949e] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#21262d]">
                  Ctrl + Enter
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Practice
