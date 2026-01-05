import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTypingText, submitResult } from '../services/api'
import { TypingTextResponse } from '../types/api'
import TypingDisplay, { TypingDisplayHandle } from '../components/TypingDisplay'
import StatsDisplay from '../components/StatsDisplay'

/**
 * Practice Page - Ultra-optimized typing test
 * 
 * ACCURACY MODEL (Monkeytype-like):
 * - Accuracy = correctKeystrokes / totalKeystrokes
 * - Backspace does NOT erase historical mistakes
 * - WPM = (correctKeystrokes / 5) / minutes
 * - Only correct keystrokes count toward WPM (cannot be gamed)
 * 
 * INVALID TEST DETECTION:
 * - Accuracy < 50% = invalid test (not submitted to leaderboard)
 * - Zero correct keystrokes = invalid test
 * 
 * PERFORMANCE:
 * - Stats calculated on 150ms interval (not per-keystroke)
 * - No React state updates during typing
 */

const MIN_ACCURACY_THRESHOLD = 50

const Practice = () => {
  const { user, isAuthenticated } = useAuth()
  
  const [textData, setTextData] = useState<TypingTextResponse | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isInvalidTest, setIsInvalidTest] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [displayStats, setDisplayStats] = useState({
    wpm: 0,
    accuracy: 0,
    totalErrors: 0,
    timeSeconds: 0,
  })
  
  const typingDisplayRef = useRef<TypingDisplayHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentTimeRef = useRef(0)

  /**
   * Calculate WPM using ONLY correct keystrokes
   * Formula: WPM = (correctKeystrokes / 5) / minutes
   * This cannot be gamed by typing wrong characters fast
   */
  const calculateWpm = useCallback((correctKeystrokes: number, timeSeconds: number): number => {
    if (timeSeconds <= 0 || correctKeystrokes <= 0) return 0
    const minutes = timeSeconds / 60
    const words = correctKeystrokes / 5
    return Math.round(words / minutes)
  }, [])

  /**
   * Calculate accuracy from PERMANENT keystroke history
   * Formula: accuracy = (correctKeystrokes / totalKeystrokes) * 100
   * Backspacing does NOT erase mistakes from this calculation
   */
  const calculateAccuracy = useCallback((correctKeystrokes: number, totalKeystrokes: number): number => {
    if (totalKeystrokes <= 0) return 0
    const accuracy = (correctKeystrokes / totalKeystrokes) * 100
    return Math.min(100, Math.max(0, accuracy))
  }, [])

  const clearAllIntervals = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = null
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const handleReset = useCallback(() => {
    clearAllIntervals()
    
    setIsStarted(false)
    setIsCompleted(false)
    setIsInvalidTest(false)
    setShowControls(true)
    setDisplayStats({ wpm: 0, accuracy: 0, totalErrors: 0, timeSeconds: 0 })
    startTimeRef.current = 0
    currentTimeRef.current = 0
    
    typingDisplayRef.current?.reset()
    containerRef.current?.focus()
  }, [clearAllIntervals])

  const loadNewText = useCallback(async () => {
    try {
      clearAllIntervals()
      
      const data = await getTypingText()
      setTextData(data)
      setIsStarted(false)
      setIsCompleted(false)
      setIsInvalidTest(false)
      setShowControls(true)
      setDisplayStats({ wpm: 0, accuracy: 0, totalErrors: 0, timeSeconds: 0 })
      startTimeRef.current = 0
      currentTimeRef.current = 0
      
      setTimeout(() => {
        typingDisplayRef.current?.reset()
        containerRef.current?.focus()
      }, 0)
    } catch (error) {
      console.error('Failed to load text:', error)
    }
  }, [clearAllIntervals])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
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
    
    if (e.key === 'Tab') {
      e.preventDefault()
    }
    
    const nativeEvent = e.nativeEvent
    typingDisplayRef.current?.handleKeyDown(nativeEvent)
  }, [handleReset, loadNewText])

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now()
    currentTimeRef.current = 0
    setIsStarted(true)
    setShowControls(false)
    
    timerIntervalRef.current = setInterval(() => {
      currentTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, 1000)
    
    // Stats interval uses PERMANENT keystroke stats
    statsIntervalRef.current = setInterval(() => {
      if (!typingDisplayRef.current || !textData) return
      
      const totalKeystrokes = typingDisplayRef.current.getTotalKeystrokes()
      const correctKeystrokes = typingDisplayRef.current.getCorrectKeystrokes()
      const incorrectKeystrokes = typingDisplayRef.current.getIncorrectKeystrokes()
      const elapsed = Math.max(1, currentTimeRef.current)
      
      const wpm = calculateWpm(correctKeystrokes, elapsed)
      const accuracy = calculateAccuracy(correctKeystrokes, totalKeystrokes)
      
      setDisplayStats({
        wpm,
        accuracy,
        totalErrors: incorrectKeystrokes,
        timeSeconds: elapsed,
      })
    }, 150)
  }, [textData, calculateWpm, calculateAccuracy])

  const handleComplete = useCallback((stats: { 
    totalKeystrokes: number
    correctKeystrokes: number
    incorrectKeystrokes: number 
  }) => {
    clearAllIntervals()
    
    const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    
    // Use PERMANENT stats for final calculation
    const wpm = calculateWpm(stats.correctKeystrokes, elapsed)
    const accuracy = calculateAccuracy(stats.correctKeystrokes, stats.totalKeystrokes)
    
    // Detect invalid test
    const isInvalid = accuracy < MIN_ACCURACY_THRESHOLD || stats.correctKeystrokes === 0
    
    const finalStats = {
      wpm: isInvalid ? 0 : wpm,
      accuracy,
      totalErrors: stats.incorrectKeystrokes,
      timeSeconds: elapsed,
    }
    
    setDisplayStats(finalStats)
    setIsCompleted(true)
    setIsInvalidTest(isInvalid)
    setShowControls(true)
    
    // Only submit valid tests
    if (user && !isInvalid) {
      submitResult(user.id, {
        wpm: finalStats.wpm,
        accuracy: finalStats.accuracy,
        totalErrors: finalStats.totalErrors,
        timeSeconds: finalStats.timeSeconds,
      }).catch((error) => {
        console.error('Failed to submit result:', error)
      })
    }
  }, [user, clearAllIntervals, calculateWpm, calculateAccuracy])

  const handleType = useCallback(() => {
    setShowControls(false)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(true)
    }, 2000)
  }, [])

  const handleContainerClick = useCallback(() => {
    containerRef.current?.focus()
  }, [])
  
  useEffect(() => {
    loadNewText()
    
    return () => {
      clearAllIntervals()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!textData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg">
        <p className="text-text-secondary text-lg">loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8 lg:px-16 xl:px-24">
        {isCompleted ? (
          <div className="w-full">
            <div className="text-center mb-10">
              {isInvalidTest ? (
                <>
                  <h2 className="text-4xl font-bold text-accent-error mb-4">Invalid Test</h2>
                  <p className="text-text-secondary mb-10">
                    Accuracy below {MIN_ACCURACY_THRESHOLD}% - try to type more accurately
                  </p>
                </>
              ) : (
                <h2 className="text-4xl font-bold text-primary mb-10">Test Completed!</h2>
              )}
              <StatsDisplay
                wpm={displayStats.wpm}
                accuracy={displayStats.accuracy}
                totalErrors={displayStats.totalErrors}
                timeSeconds={displayStats.timeSeconds}
              />
              {!isAuthenticated && !isInvalidTest && (
                <p className="mt-10 text-text-secondary">
                  <Link to="/login" className="text-primary font-semibold">
                    Create an account
                  </Link>
                  {' '}to save your progress and compete on the leaderboard!
                </p>
              )}
            </div>
            
            <div className="flex justify-center space-x-10 mt-10">
              <button
                onClick={handleReset}
                className="text-text-secondary hover:text-text font-medium text-lg"
              >
                reset
              </button>
              <button
                onClick={loadNewText}
                className="text-text-secondary hover:text-text font-medium text-lg"
              >
                new test
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {!isAuthenticated && !isStarted && (
              <div className="text-center mb-6">
                <p className="text-text-muted">
                  practicing as guest · <Link to="/login" className="text-primary">login</Link> to save progress
                </p>
              </div>
            )}

            <div 
              ref={containerRef}
              className="typing-area"
              onClick={handleContainerClick}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              autoFocus
            >
              <TypingDisplay
                ref={typingDisplayRef}
                originalText={textData.text}
                onStart={handleStart}
                onComplete={handleComplete}
                onType={handleType}
              />
            </div>
            
            {!isStarted && (
              <div className="text-center text-text-muted mt-6">
                click above or start typing...
              </div>
            )}

            <div 
              className={`mt-10 flex justify-center space-x-10 transition-opacity duration-200 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={handleReset}
                className="text-text-muted hover:text-text-secondary"
              >
                reset
              </button>
              <button
                onClick={loadNewText}
                className="text-text-muted hover:text-text-secondary"
              >
                new test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Practice
