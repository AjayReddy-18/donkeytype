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

// Word mode: generate exact count + small buffer for windowing
// CRITICAL: No infinite append in word mode - test ends at exact word count
const WORD_MODE_BUFFER = 10

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
  
  // Word mode progress tracking (for UI display)
  // completedWords = words user has finished (space pressed after)
  const [completedWords, setCompletedWords] = useState(0)
  
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
  
  // WORD MODE TERMINATION TRACKING
  // targetWordCountRef = exact number of words user must type to complete
  // typedWordCountRef = number of words completed (space pressed after word)
  // These are the SOURCE OF TRUTH for word mode completion - not fullWords.length
  const targetWordCountRef = useRef(0)
  const wordCountRef = useRef(wordCount) // Ref for use in callbacks

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
    setCompletedWords(0) // Reset word counter
    startTimeRef.current = 0
    currentTimeRef.current = 0
    
    typingDisplayRef.current?.reset()
    containerRef.current?.focus()
  }, [clearAllIntervals])

  const loadNewText = useCallback(() => {
    clearAllIntervals()
    
    // Generate words based on mode
    // Time mode: use DEFAULT_WORD_COUNTS buffer (infinite append allowed)
    // Word mode: generate exact count + small buffer (NO infinite append)
    let wordsToGenerate: number
    if (testModeRef.current === 'time') {
      wordsToGenerate = DEFAULT_WORD_COUNTS[timeDuration]
      targetWordCountRef.current = 0 // No target in time mode
    } else {
      // WORD MODE: Set strict target for termination
      // Generate target + buffer for windowing, but test ends at exact target
      targetWordCountRef.current = wordCountRef.current
      wordsToGenerate = wordCountRef.current + WORD_MODE_BUFFER
    }
    
    const generated = generateWords({
      wordCount: wordsToGenerate,
      punctuationEnabled: punctuationEnabledRef.current,
    })
    
    setTextData({ text: generated.text })
    setIsStarted(false)
    setIsCompleted(false)
    setIsInvalidTest(false)
    setShowControls(true)
    setDisplayStats({ wpm: 0, accuracy: 0, totalErrors: 0, timeSeconds: 0 })
    setCompletedWords(0) // Reset word counter
    startTimeRef.current = 0
    currentTimeRef.current = 0
    
    setTimeout(() => {
      typingDisplayRef.current?.reset()
      containerRef.current?.focus()
    }, 0)
  }, [clearAllIntervals, timeDuration])

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
    // Also handles:
    // - Time mode: word auto-append when running low
    // - Word mode: strict termination at target word count
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
      
      if (testModeRef.current === 'time') {
        // TIME MODE: Auto-append words when running low (infinite)
        const remainingWords = typingDisplayRef.current.getRemainingWordCount()
        if (remainingWords < WORD_APPEND_THRESHOLD) {
          const newWords = generateMoreWords(WORD_APPEND_BATCH_SIZE, punctuationEnabledRef.current)
          typingDisplayRef.current.appendWords(newWords)
        }
      } else {
        // WORD MODE: Track progress for UI display
        const currentCompletedWords = typingDisplayRef.current.getCompletedWordCount()
        setCompletedWords(currentCompletedWords)
        
        // CRITICAL: typedWordCount === targetWordCount means test is DONE
        // This check happens BEFORE any word appending
        if (targetWordCountRef.current > 0 && currentCompletedWords >= targetWordCountRef.current) {
          // Test complete - freeze immediately
          typingDisplayRef.current.forceComplete()
        }
        // NO word appending in word mode - buffer is fixed at load time
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
    wordCountRef.current = wordCount
  }, [wordCount])

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

  /**
   * ===== LAYOUT CONTRACT (DO NOT BREAK) =====
   * 
   * Page is full width.
   * Content wrapper is fixed width and centered.
   * Text is left-aligned inside wrapper.
   * 
   * RULES:
   * 1. Page container = full viewport width (bg-bg)
   * 2. Content wrapper = 90% width, max 1600px, centered via margin auto
   * 3. Text flows naturally with word wrap (~70-90 chars per line)
   * 4. NO centering of text itself - only the wrapper is centered
   * 5. Vertical centering via flexbox (justify-center)
   * 
   * This matches Monkeytype's visual balance:
   * - Wide text block spans nearly edge-to-edge
   * - Natural left alignment for readability
   * - Vertically centered in viewport
   */
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg flex flex-col">
      {/* Content wrapper: 90% width, max 1600px, vertically centered */}
      <div 
        className="flex-1 flex flex-col justify-center mx-auto px-6"
        style={{ width: '90%', maxWidth: '1600px' }}
        data-testid="content-wrapper"
      >
        {isCompleted ? (
          <div className="w-full">
            {/* Completion view - centered within wrapper for visual balance */}
            <div className="text-center mb-6">
              {isInvalidTest ? (
                <>
                  <h2 className="text-2xl font-bold text-accent-error mb-2">Invalid Test</h2>
                  <p className="text-text-secondary text-sm mb-4">
                    Accuracy below {MIN_ACCURACY_THRESHOLD}%
                  </p>
                </>
              ) : (
                <h2 className="text-2xl font-bold text-primary mb-4">Test Completed!</h2>
              )}
              <StatsDisplay
                wpm={displayStats.wpm}
                accuracy={displayStats.accuracy}
                totalErrors={displayStats.totalErrors}
                timeSeconds={displayStats.timeSeconds}
              />
              {!isAuthenticated && !isInvalidTest && (
                <p className="mt-4 text-text-muted text-xs">
                  <Link to="/login" className="text-primary">login</Link> to save
                </p>
              )}
            </div>
            
            <div className="flex justify-center gap-6 mt-4">
              <button onClick={handleReset} className="text-text-muted hover:text-text-secondary text-sm">
                reset
              </button>
              <button onClick={loadNewText} className="text-text-muted hover:text-text-secondary text-sm">
                new test
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Controls - centered above text for visual balance */}
            {!isStarted && (
              <div className="flex flex-col items-center gap-2 mb-6">
                {/* Row 1: Login hint (separate from controls) */}
                {!isAuthenticated && (
                  <p className="text-text-muted text-xs">
                    <Link to="/login" className="text-primary hover:underline">login</Link> to save progress
                  </p>
                )}
                
                {/* Row 2: Mode controls ONLY */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  {/* Mode selector */}
                  <button
                    onClick={() => { setTestMode('time'); testModeRef.current = 'time'; loadNewText() }}
                    className={testMode === 'time' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                  >
                    time
                  </button>
                  <button
                    onClick={() => { setTestMode('words'); testModeRef.current = 'words'; loadNewText() }}
                    className={testMode === 'words' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                  >
                    words
                  </button>

                  <span className="text-text-muted">·</span>

                  {/* Time/Word options */}
                  {testMode === 'time' ? (
                    ([30, 60, 120] as TimeDuration[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => { setTimeDuration(d); loadNewText() }}
                        className={timeDuration === d ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                      >
                        {d}
                      </button>
                    ))
                  ) : (
                    WORD_COUNT_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setWordCount(c); wordCountRef.current = c; loadNewText() }}
                        className={wordCount === c ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                      >
                        {c}
                      </button>
                    ))
                  )}

                  <span className="text-text-muted">·</span>

                  {/* Punctuation toggle */}
                  <button
                    onClick={() => {
                      const newVal = !punctuationEnabled
                      setPunctuationEnabled(newVal)
                      punctuationEnabledRef.current = newVal
                      loadNewText()
                    }}
                    className={punctuationEnabled ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                    title="Punctuation"
                  >
                    @ #
                  </button>
                </div>
              </div>
            )}

            {/* Progress indicator - centered above text */}
            {isStarted && (
              <div className="flex justify-center mb-4" data-testid="progress-indicator">
                {testMode === 'time' ? (
                  // TIME MODE: Show countdown timer
                  <span className="text-3xl font-bold text-primary tabular-nums" data-testid="timer-display">
                    {Math.max(0, timeDuration - displayStats.timeSeconds)}
                  </span>
                ) : (
                  // WORD MODE: Show word counter (typed / total)
                  <span className="text-3xl font-bold text-primary tabular-nums" data-testid="word-counter">
                    {completedWords} / {wordCount}
                  </span>
                )}
              </div>
            )}

            {/* Typing area - THE VISUAL FOCUS
                Text is LEFT-ALIGNED inside wrapper (matches Monkeytype)
                Natural word wrap creates ~70-90 char lines */}
            <div 
              ref={containerRef}
              className="typing-area text-left"
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
            
            {/* Hint + controls - centered below text */}
            <div className={`mt-4 flex justify-center items-center gap-6 text-xs text-text-muted transition-opacity duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              {!isStarted && <span>tab to restart</span>}
              <button onClick={handleReset} className="hover:text-text-secondary">reset</button>
              <button onClick={loadNewText} className="hover:text-text-secondary">new</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Practice
