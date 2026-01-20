import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { submitResult } from '../services/api'
import TypingDisplay, { TypingDisplayHandle } from '../components/TypingDisplay'
import StatsDisplay from '../components/StatsDisplay'
import { generateWords, generateMoreWords, DEFAULT_WORD_COUNTS, TimeDuration } from '../utils/wordGenerator'

/**
 * Practice Page - Ultra-optimized typing test
 * 
 * MODES:
 * - Time-based: 30s / 60s / 120s (timer ends test)
 * - Word-based: 25 / 50 / 100 words (typing all words ends test)
 * - Offline: Words generated in frontend, no API calls
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
 * - Words auto-appended in batches, not per keystroke (time mode only)
 * - Text windowing: only 3 lines visible at a time
 */

const MIN_ACCURACY_THRESHOLD = 50
const WORD_APPEND_THRESHOLD = 20 // Append more words when remaining < this
const WORD_APPEND_BATCH_SIZE = 50 // How many words to append at once

// Word count options for word-based mode
const WORD_COUNT_OPTIONS = [25, 50, 100] as const
type WordCountOption = typeof WORD_COUNT_OPTIONS[number]

// Test mode types
type TestMode = 'time' | 'words'

const Practice = () => {
  const { user, isAuthenticated } = useAuth()
  
  // Test text and state
  const [textData, setTextData] = useState<{ text: string } | null>(null)
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
  
  // Mode settings (persisted across tests)
  const [testMode, setTestMode] = useState<TestMode>('time')
  const [timeDuration, setTimeDuration] = useState<TimeDuration>(30)
  const [wordCount, setWordCount] = useState<WordCountOption>(50)
  const [punctuationEnabled, setPunctuationEnabled] = useState(false)
  
  // Refs (no re-renders during typing)
  const typingDisplayRef = useRef<TypingDisplayHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentTimeRef = useRef(0)
  const punctuationEnabledRef = useRef(punctuationEnabled) // Ref for use in callbacks
  const testModeRef = useRef(testMode) // Ref for use in callbacks

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

  const loadNewText = useCallback(() => {
    clearAllIntervals()
    
    // Generate words based on mode
    // Time mode: use DEFAULT_WORD_COUNTS buffer
    // Word mode: use exact word count
    const targetWordCount = testModeRef.current === 'time' 
      ? DEFAULT_WORD_COUNTS[timeDuration]
      : wordCount
    
    const generated = generateWords({
      wordCount: targetWordCount,
      punctuationEnabled: punctuationEnabledRef.current,
    })
    
    setTextData({ text: generated.text })
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
  }, [clearAllIntervals, timeDuration, wordCount])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Tab key resets test (like Monkeytype)
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      loadNewText()
      return
    }
    
    // Ctrl+Tab / Cmd+Tab for new test
    if (e.key === 'Tab' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      loadNewText()
      return
    }
    
    // Ctrl+Enter / Cmd+Enter for new test
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      loadNewText()
      return
    }
    
    // Ctrl+Shift+K for reset (keep same text)
    if (e.key === 'k' && e.ctrlKey && e.shiftKey) {
      e.preventDefault()
      handleReset()
      return
    }
    
    // Escape also resets (additional convenience)
    if (e.key === 'Escape') {
      e.preventDefault()
      loadNewText()
      return
    }
    
    const nativeEvent = e.nativeEvent
    typingDisplayRef.current?.handleKeyDown(nativeEvent)
  }, [handleReset, loadNewText])

  const handleStart = useCallback(() => {
    startTimeRef.current = Date.now()
    currentTimeRef.current = 0
    setIsStarted(true)
    setShowControls(false)
    
    // Timer counts up and checks for time limit (time mode only)
    timerIntervalRef.current = setInterval(() => {
      currentTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000)
      
      // Check if timed test has ended (time mode only)
      if (testModeRef.current === 'time' && currentTimeRef.current >= timeDuration) {
        // Force complete the test
        typingDisplayRef.current?.forceComplete()
      }
    }, 1000)
    
    // Stats interval uses PERMANENT keystroke stats
    // Also handles word auto-append in time mode (batched, not per-keystroke)
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
      
      // Auto-append words when running low (TIME MODE ONLY)
      // Word mode has fixed word count
      if (testModeRef.current === 'time') {
        const remainingWords = typingDisplayRef.current.getRemainingWordCount()
        if (remainingWords < WORD_APPEND_THRESHOLD) {
          const newWords = generateMoreWords(WORD_APPEND_BATCH_SIZE, punctuationEnabledRef.current)
          typingDisplayRef.current.appendWords(newWords)
        }
      }
    }, 150)
  }, [textData, timeDuration, calculateWpm, calculateAccuracy])

  const handleComplete = useCallback((stats: { 
    totalKeystrokes: number
    correctKeystrokes: number
    incorrectKeystrokes: number 
  }) => {
    clearAllIntervals()
    
    const actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    
    // For timed mode, cap at time duration; for word mode, use actual elapsed
    const elapsed = testModeRef.current === 'time'
      ? Math.max(1, Math.min(actualElapsed, timeDuration))
      : Math.max(1, actualElapsed)
    
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
  }, [user, clearAllIntervals, timeDuration, calculateWpm, calculateAccuracy])

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
  
  // Sync refs with state (for use in callbacks)
  useEffect(() => {
    punctuationEnabledRef.current = punctuationEnabled
  }, [punctuationEnabled])

  useEffect(() => {
    testModeRef.current = testMode
  }, [testMode])

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

            {/* Mode selector - only visible when not started */}
            {!isStarted && (
              <div className="flex flex-col items-center gap-4 mb-8">
                {/* Test mode toggle (time vs words) */}
                <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => {
                      setTestMode('time')
                      testModeRef.current = 'time'
                      loadNewText()
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      testMode === 'time'
                        ? 'bg-primary text-bg'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    time
                  </button>
                  <button
                    onClick={() => {
                      setTestMode('words')
                      testModeRef.current = 'words'
                      loadNewText()
                    }}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      testMode === 'words'
                        ? 'bg-primary text-bg'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    words
                  </button>
                </div>

                {/* Options row */}
                <div className="flex items-center gap-6">
                  {/* Time duration selector (only in time mode) */}
                  {testMode === 'time' && (
                    <div className="flex items-center gap-2">
                      {([30, 60, 120] as TimeDuration[]).map((duration) => (
                        <button
                          key={duration}
                          onClick={() => {
                            setTimeDuration(duration)
                            loadNewText()
                          }}
                          className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                            timeDuration === duration
                              ? 'bg-bg-tertiary text-primary'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Word count selector (only in words mode) */}
                  {testMode === 'words' && (
                    <div className="flex items-center gap-2">
                      {WORD_COUNT_OPTIONS.map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setWordCount(count)
                            loadNewText()
                          }}
                          className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                            wordCount === count
                              ? 'bg-bg-tertiary text-primary'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="w-px h-6 bg-border" />

                  {/* Punctuation toggle - immediately regenerates if test not started */}
                  <button
                    onClick={() => {
                      const newValue = !punctuationEnabled
                      setPunctuationEnabled(newValue)
                      punctuationEnabledRef.current = newValue
                      // Immediately regenerate with new setting
                      loadNewText()
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                      punctuationEnabled
                        ? 'bg-bg-tertiary text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                    title={punctuationEnabled ? 'Punctuation enabled' : 'Punctuation disabled'}
                  >
                    <span>@ #</span>
                  </button>
                </div>
              </div>
            )}

            {/* Timer display when test is running */}
            {isStarted && (
              <div className="flex justify-center mb-6">
                <span className="text-4xl font-bold text-primary tabular-nums">
                  {testMode === 'time' 
                    ? Math.max(0, timeDuration - displayStats.timeSeconds)
                    : displayStats.timeSeconds
                  }
                </span>
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
