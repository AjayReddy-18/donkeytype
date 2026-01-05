import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTypingText, submitResult } from '../services/api'
import { TypingTextResponse } from '../types/api'
import TypingDisplay, { TypingDisplayHandle } from '../components/TypingDisplay'
import StatsDisplay from '../components/StatsDisplay'
import { calculateWpm } from '../utils/typingEngine'

/**
 * Practice Page - Ultra-optimized typing test
 * 
 * PERFORMANCE ARCHITECTURE:
 * - NO React state updates during typing
 * - Stats calculated on 150ms interval (not per-keystroke)
 * - All typing logic handled via refs and direct DOM manipulation
 * - React only re-renders on: test start, test complete, reset, new test
 */

const Practice = () => {
  const { user, isAuthenticated } = useAuth()
  
  // ===== REACT STATE - Only updated on major events =====
  const [textData, setTextData] = useState<TypingTextResponse | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [displayStats, setDisplayStats] = useState({
    wpm: 0,
    accuracy: 0,
    totalErrors: 0,
    timeSeconds: 0,
  })
  
  // ===== REFS - For typing state (no re-renders) =====
  const typingDisplayRef = useRef<TypingDisplayHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentTimeRef = useRef(0)

  // ===== HELPER FUNCTIONS =====
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
      setShowControls(true)
      setDisplayStats({ wpm: 0, accuracy: 0, totalErrors: 0, timeSeconds: 0 })
      startTimeRef.current = 0
      currentTimeRef.current = 0
      
      // Reset typing display after state update
      setTimeout(() => {
        typingDisplayRef.current?.reset()
        containerRef.current?.focus()
      }, 0)
    } catch (error) {
      console.error('Failed to load text:', error)
    }
  }, [clearAllIntervals])

  // ===== KEYBOARD EVENT HANDLER =====
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle shortcuts
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
    
    // Prevent default for Tab to avoid focus loss
    if (e.key === 'Tab') {
      e.preventDefault()
    }
    
    // Forward to typing display (convert React event to native event)
    const nativeEvent = e.nativeEvent
    typingDisplayRef.current?.handleKeyDown(nativeEvent)
  }, [handleReset, loadNewText])

  // ===== CALLBACKS FOR TYPING DISPLAY =====
  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now()
    currentTimeRef.current = 0
    setIsStarted(true)
    setShowControls(false)
    
    // Start timer interval (1 second)
    timerIntervalRef.current = setInterval(() => {
      currentTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, 1000)
    
    // Start stats calculation interval (150ms) - NOT per-keystroke!
    statsIntervalRef.current = setInterval(() => {
      if (!typingDisplayRef.current || !textData) return
      
      const currentIndex = typingDisplayRef.current.getCurrentIndex()
      const errorCount = typingDisplayRef.current.getErrorCount()
      const elapsed = Math.max(1, currentTimeRef.current)
      
      const wpm = calculateWpm(currentIndex, elapsed)
      const accuracy = currentIndex > 0 
        ? Math.max(0, ((currentIndex - errorCount) / currentIndex) * 100)
        : 100
      
      // This updates the UI but typing continues uninterrupted
      setDisplayStats({
        wpm,
        accuracy,
        totalErrors: errorCount,
        timeSeconds: elapsed,
      })
    }, 150)
  }, [textData])

  const handleComplete = useCallback((stats: { errorCount: number; correctCount: number }) => {
    clearAllIntervals()
    
    const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    const totalChars = stats.correctCount + stats.errorCount
    const wpm = calculateWpm(totalChars, elapsed)
    const accuracy = totalChars > 0 
      ? Math.max(0, ((totalChars - stats.errorCount) / totalChars) * 100)
      : 100
    
    const finalStats = {
      wpm,
      accuracy,
      totalErrors: stats.errorCount,
      timeSeconds: elapsed,
    }
    
    setDisplayStats(finalStats)
    setIsCompleted(true)
    setShowControls(true)
    
    // Submit result if authenticated
    if (user) {
      submitResult(user.id, {
        wpm: finalStats.wpm,
        accuracy: finalStats.accuracy,
        totalErrors: finalStats.totalErrors,
        timeSeconds: finalStats.timeSeconds,
      }).catch((error) => {
        console.error('Failed to submit result:', error)
      })
    }
  }, [user, clearAllIntervals])

  const handleType = useCallback(() => {
    // Hide controls while typing, show after 2s of inactivity
    setShowControls(false)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(true)
    }, 2000)
  }, [])

  // Focus container on click
  const handleContainerClick = useCallback(() => {
    containerRef.current?.focus()
  }, [])
  
  // ===== FETCH TEXT ON MOUNT =====
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
          // Results view
          <div className="w-full">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-primary mb-10">Test Completed!</h2>
              <StatsDisplay
                wpm={displayStats.wpm}
                accuracy={displayStats.accuracy}
                totalErrors={displayStats.totalErrors}
                timeSeconds={displayStats.timeSeconds}
              />
              {!isAuthenticated && (
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
          // Typing view
          <div className="w-full">
            {/* Guest message */}
            {!isAuthenticated && !isStarted && (
              <div className="text-center mb-6">
                <p className="text-text-muted">
                  practicing as guest · <Link to="/login" className="text-primary">login</Link> to save progress
                </p>
              </div>
            )}

            {/* Typing area - focusable container (no input/contenteditable) */}
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
            
            {/* Start prompt */}
            {!isStarted && (
              <div className="text-center text-text-muted mt-6">
                click above or start typing...
              </div>
            )}

            {/* Controls */}
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
