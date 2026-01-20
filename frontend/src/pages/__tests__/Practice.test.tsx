import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Practice from '../Practice'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { UserResponse } from '../../types/api'
import * as wordGenerator from '../../utils/wordGenerator'

vi.mock('../../services/api', () => ({
  submitResult: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../components/StatsDisplay', () => ({
  default: ({ wpm, accuracy, totalErrors, timeSeconds }: { 
    wpm: number
    accuracy: number
    totalErrors: number
    timeSeconds: number 
  }) => (
    <div data-testid="stats-display">
      <span>WPM: {wpm}</span>
      <span>Accuracy: {accuracy}%</span>
      <span>Errors: {totalErrors}</span>
      <span>Time: {timeSeconds}</span>
    </div>
  ),
}))

// Mock word generator to return deterministic text for testing
vi.mock('../../utils/wordGenerator', () => ({
  generateWords: vi.fn(),
  generateMoreWords: vi.fn(),
  DEFAULT_WORD_COUNTS: { 30: 100, 60: 200, 120: 400 },
}))

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockSubmitResult = api.submitResult as ReturnType<typeof vi.fn>
const mockGenerateWords = wordGenerator.generateWords as ReturnType<typeof vi.fn>
const mockGenerateMoreWords = wordGenerator.generateMoreWords as ReturnType<typeof vi.fn>

const mockUser: UserResponse = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  bestWpm: 100,
  averageAccuracy: 95,
  totalTests: 10,
  createdAt: '2024-01-01',
}

const mockUseAuthReturn = {
  user: null as UserResponse | null,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}

const renderPractice = () => {
  return render(
    <BrowserRouter>
      <Practice />
    </BrowserRouter>
  )
}

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue(mockUseAuthReturn)
    mockSubmitResult.mockResolvedValue({})
    // Default mock returns 'test text' for general tests
    mockGenerateWords.mockReturnValue({ words: ['test', 'text'], text: 'test text' })
    mockGenerateMoreWords.mockReturnValue(['more', 'words'])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should load and display typing text (generated offline)', async () => {
    renderPractice()
    
    await waitFor(() => {
      // Text is now generated offline, hint shows "tab to restart"
      expect(screen.getByText(/tab to restart/)).toBeInTheDocument()
    })
  })

  it('should show login link when not authenticated', async () => {
    renderPractice()
    
    await waitFor(() => {
      // Guest message now shows as "login to save"
      expect(screen.getByText(/login/)).toBeInTheDocument()
      expect(screen.getByText(/to save/)).toBeInTheDocument()
    })
  })

  it('should not show login prompt when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/tab to restart/)).toBeInTheDocument()
    })
    
    // Should not have "login to save" text visible in controls
    const loginLinks = screen.queryAllByText(/login/)
    // Authenticated users don't see "login to save" in controls
    expect(loginLinks.length).toBe(0)
  })

  it('should show restart hint', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/tab to restart/)).toBeInTheDocument()
    })
  })

  it('should show reset and new buttons initially', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getAllByText('reset').length).toBeGreaterThan(0)
      // Button text is now just "new" instead of "new test"
      expect(screen.getAllByText('new').length).toBeGreaterThan(0)
    })
  })

  it('should load new text when new button is clicked', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/tab to restart/)).toBeInTheDocument()
    })
    
    // Click new button - this regenerates words locally (no API call)
    fireEvent.click(screen.getAllByText('new')[0])
    
    // Should still show the typing prompt
    await waitFor(() => {
      expect(screen.getByText(/tab to restart/)).toBeInTheDocument()
    })
  })

  it('should render typing display', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
  })

  it('should have characters pre-rendered as spans', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      const chars = container.querySelectorAll('.char')
      expect(chars.length).toBeGreaterThan(0)
    })
  })

  it('should show stats display after completion (no trailing space required)', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    expect(focusable).toBeInTheDocument()
    
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      expect(screen.getByTestId('stats-display')).toBeInTheDocument()
    })
  })

  it('should submit result when authenticated and test is completed', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(mockSubmitResult).toHaveBeenCalled()
    })
  })

  it('should not submit result when not authenticated', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    })
    
    expect(mockSubmitResult).not.toHaveBeenCalled()
  })

  it('should show login link after completion when guest', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      // Text is now "login to save" instead of "Create an account"
      expect(screen.getByText(/login/)).toBeInTheDocument()
    })
  })

  it('should show Invalid Test for low accuracy', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'x' })
    fireEvent.keyDown(focusable, { key: 'y' })
    
    await waitFor(() => {
      expect(screen.getByText('Invalid Test')).toBeInTheDocument()
    })
  })

  it('should not submit invalid tests', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'x' })
    fireEvent.keyDown(focusable, { key: 'y' })
    
    await waitFor(() => {
      expect(screen.getByText('Invalid Test')).toBeInTheDocument()
    })
    
    expect(mockSubmitResult).not.toHaveBeenCalled()
  })

  it('should show invalid test when mistake is corrected but accuracy still low', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    // Type wrong, backspace, wrong again, backspace, then correct
    // Results in 3 wrong + 2 correct = 5 total, accuracy = 40%
    fireEvent.keyDown(focusable, { key: 'x' })
    fireEvent.keyDown(focusable, { key: 'Backspace' })
    fireEvent.keyDown(focusable, { key: 'y' })
    fireEvent.keyDown(focusable, { key: 'Backspace' })
    fireEvent.keyDown(focusable, { key: 'z' })
    fireEvent.keyDown(focusable, { key: 'Backspace' })
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(screen.getByText('Invalid Test')).toBeInTheDocument()
    })
  })

  it('should reset test when reset is clicked', async () => {
    mockGenerateWords.mockReturnValue({ words: ['test'], text: 'test' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 't' })
    
    fireEvent.click(screen.getAllByText('reset')[0])
    
    await waitFor(() => {
      const pendingChars = container.querySelectorAll('.char.pending')
      expect(pendingChars.length).toBe(4)
    })
  })

  it('should handle Ctrl+Enter shortcut for new test', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'Enter', ctrlKey: true })
    
    // Words are regenerated locally - just verify UI is still working
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
  })

  it('should handle Ctrl+Tab shortcut for new test', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'Tab', ctrlKey: true })
    
    // Words are regenerated locally - just verify UI is still working
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
  })

  it('should handle Ctrl+Shift+K shortcut for reset', async () => {
    mockGenerateWords.mockReturnValue({ words: ['test'], text: 'test' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 't' })
    
    expect(container.querySelector('.char.correct')).toBeInTheDocument()
    
    fireEvent.keyDown(focusable, { key: 'k', ctrlKey: true, shiftKey: true })
    
    await waitFor(() => {
      const pendingChars = container.querySelectorAll('.char.pending')
      expect(pendingChars.length).toBe(4)
    })
  })

  it('should prevent Tab default behavior', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    
    focusable.dispatchEvent(event)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should focus container when clicking on typing area', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.click(focusable)
    
    expect(document.activeElement).toBe(focusable)
  })

  it('should handle submit result error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    mockSubmitResult.mockRejectedValue(new Error('Submit failed'))
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit result:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('should track errors correctly using permanent stats', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'x' }) // wrong
    fireEvent.keyDown(focusable, { key: 'Backspace' })
    fireEvent.keyDown(focusable, { key: 'a' }) // correct
    fireEvent.keyDown(focusable, { key: 'b' }) // correct, completes
    
    await waitFor(() => {
      // Should have 1 error permanently counted
      expect(mockSubmitResult).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          totalErrors: 1,
        })
      )
    })
  })

  it('should show reset and new buttons after completion', async () => {
    mockGenerateWords.mockReturnValue({ words: ['ab'], text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    })
    
    expect(screen.getAllByText('reset').length).toBeGreaterThan(0)
    // Button text is "new test" in completion view
    expect(screen.getAllByText('new test').length).toBeGreaterThan(0)
  })

  describe('Timed Mode', () => {
    it('should show time duration selector buttons', async () => {
      renderPractice()
      
      await waitFor(() => {
        // Mode buttons show as "time" / "words" 
        expect(screen.getByText('time')).toBeInTheDocument()
        // Time options show as just numbers: 30, 60, 120
        expect(screen.getByText('30')).toBeInTheDocument()
        expect(screen.getByText('60')).toBeInTheDocument()
        expect(screen.getByText('120')).toBeInTheDocument()
      })
    })

    it('should allow changing time duration', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('30')).toBeInTheDocument()
      })
      
      // Click 60 button
      fireEvent.click(screen.getByText('60'))
      
      // 60 button should now be active (has text-primary class in new UI)
      await waitFor(() => {
        const button60 = screen.getByText('60')
        expect(button60.classList.contains('text-primary')).toBe(true)
      })
    })

    it('should show countdown timer when test starts', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Get first character from the generated text ('t' from 'test')
      fireEvent.keyDown(focusable, { key: 't' })
      
      // Timer should appear (showing remaining time)
      await waitFor(() => {
        // Timer uses text-3xl in the updated UI
        const timerDisplay = container.querySelector('.text-3xl.font-bold')
        expect(timerDisplay).toBeInTheDocument()
      })
    })

    it('should hide mode selector when test starts', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('time')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      fireEvent.keyDown(focusable, { key: 't' })
      
      await waitFor(() => {
        // Mode selector should be hidden during typing
        expect(screen.queryByText('time')).not.toBeInTheDocument()
      })
    })
  })

  describe('Punctuation Toggle', () => {
    it('should show punctuation toggle button', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('@ #')).toBeInTheDocument()
      })
    })

    it('should toggle punctuation setting', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('@ #')).toBeInTheDocument()
      })
      
      // Get the parent button element
      const toggleButton = screen.getByText('@ #').closest('button') as HTMLElement
      
      // Initially disabled (text-text-muted in new UI)
      expect(toggleButton.classList.contains('text-primary')).toBe(false)
      
      // Click to enable - this immediately regenerates
      fireEvent.click(toggleButton)
      
      // Should now be active (text-primary in new UI)
      await waitFor(() => {
        expect(toggleButton.classList.contains('text-primary')).toBe(true)
      })
    })

    it('should regenerate words when duration changes', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      // Clear mock calls from initial render
      mockGenerateWords.mockClear()
      
      // Change duration - this regenerates words (use '60' not '60s')
      fireEvent.click(screen.getByText('60'))
      
      await waitFor(() => {
        // generateWords should have been called again
        expect(mockGenerateWords).toHaveBeenCalled()
      })
    })
  })

  describe('Word Mode', () => {
    it('should show word mode toggle', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('words')).toBeInTheDocument()
      })
    })

    it('should switch to word mode', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('words')).toBeInTheDocument()
      })
      
      // Click words button
      fireEvent.click(screen.getByText('words'))
      
      // Should show word count options
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
      })
    })

    it('should generate word count plus buffer in word mode', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('words')).toBeInTheDocument()
      })
      
      mockGenerateWords.mockClear()
      
      // Switch to word mode and select 25 words
      fireEvent.click(screen.getByText('words'))
      fireEvent.click(screen.getByText('25'))
      
      await waitFor(() => {
        // Should be called with 25 + buffer (10) = 35 words
        expect(mockGenerateWords).toHaveBeenCalledWith(
          expect.objectContaining({
            wordCount: 35, // 25 target + 10 buffer
          })
        )
      })
    })

    it('should reset word count when switching word count options', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('words')).toBeInTheDocument()
      })
      
      // Switch to word mode
      fireEvent.click(screen.getByText('words'))
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
      })
      
      mockGenerateWords.mockClear()
      
      // Select 100 words
      fireEvent.click(screen.getByText('100'))
      
      await waitFor(() => {
        // Should regenerate with 100 + buffer
        expect(mockGenerateWords).toHaveBeenCalledWith(
          expect.objectContaining({
            wordCount: 110, // 100 target + 10 buffer
          })
        )
      })
    })
  })

  describe('Mode Reset Consistency', () => {
    it('should reset state when switching from time to word mode via Tab then click', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Type something in time mode
      fireEvent.keyDown(focusable, { key: 't' })
      
      // Verify typing started (char should be correct)
      expect(container.querySelector('.char.correct')).toBeInTheDocument()
      
      // Press Tab to reset (controls become visible again)
      fireEvent.keyDown(focusable, { key: 'Tab' })
      
      await waitFor(() => {
        // Controls should be visible again
        expect(screen.getByText('words')).toBeInTheDocument()
      })
      
      mockGenerateWords.mockClear()
      
      // Switch to word mode
      fireEvent.click(screen.getByText('words'))
      
      await waitFor(() => {
        // Should regenerate words
        expect(mockGenerateWords).toHaveBeenCalled()
        // All chars should be pending again
        const pendingChars = container.querySelectorAll('.char.pending')
        expect(pendingChars.length).toBeGreaterThan(0)
      })
    })

    it('should reset state when switching time durations via Tab then click', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Type something
      fireEvent.keyDown(focusable, { key: 't' })
      
      expect(container.querySelector('.char.correct')).toBeInTheDocument()
      
      // Press Tab to reset (controls become visible again)
      fireEvent.keyDown(focusable, { key: 'Tab' })
      
      await waitFor(() => {
        // Controls should be visible again
        expect(screen.getByText('60')).toBeInTheDocument()
      })
      
      mockGenerateWords.mockClear()
      
      // Change duration
      fireEvent.click(screen.getByText('60'))
      
      await waitFor(() => {
        expect(mockGenerateWords).toHaveBeenCalled()
        // All chars should be pending again
        const correctChars = container.querySelectorAll('.char.correct')
        expect(correctChars.length).toBe(0)
      })
    })
  })

  describe('Tab Reset', () => {
    it('should reset test when Tab is pressed', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Type something first
      fireEvent.keyDown(focusable, { key: 't' })
      
      // Clear mock to check if Tab regenerates
      mockGenerateWords.mockClear()
      
      // Press Tab to reset
      fireEvent.keyDown(focusable, { key: 'Tab' })
      
      await waitFor(() => {
        // generateWords should have been called to regenerate text
        expect(mockGenerateWords).toHaveBeenCalled()
      })
    })
  })

  describe('Layout Contract', () => {
    /**
     * LAYOUT CONTRACT TESTS
     * 
     * Page is full width.
     * Content wrapper is fixed width (1100px) and centered.
     * Text is left-aligned inside wrapper.
     */

    it('should have content wrapper with data-testid', async () => {
      renderPractice()
      
      await waitFor(() => {
        const wrapper = screen.getByTestId('content-wrapper')
        expect(wrapper).toBeInTheDocument()
      })
    })

    it('should have content wrapper with max-width constraint', async () => {
      renderPractice()
      
      await waitFor(() => {
        const wrapper = screen.getByTestId('content-wrapper')
        expect(wrapper).toHaveStyle({ maxWidth: '1600px' })
      })
    })

    it('should have content wrapper with 90% width', async () => {
      renderPractice()
      
      await waitFor(() => {
        const wrapper = screen.getByTestId('content-wrapper')
        expect(wrapper).toHaveStyle({ width: '90%' })
      })
    })

    it('should center content wrapper with mx-auto', async () => {
      renderPractice()
      
      await waitFor(() => {
        const wrapper = screen.getByTestId('content-wrapper')
        expect(wrapper.classList.contains('mx-auto')).toBe(true)
      })
    })

    it('should vertically center content with justify-center', async () => {
      renderPractice()
      
      await waitFor(() => {
        const wrapper = screen.getByTestId('content-wrapper')
        expect(wrapper.classList.contains('justify-center')).toBe(true)
      })
    })

    it('should have typing area with left text alignment', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        const typingArea = container.querySelector('.typing-area')
        expect(typingArea).toBeInTheDocument()
        expect(typingArea?.classList.contains('text-left')).toBe(true)
      })
    })
  })

  describe('Word Counter Display', () => {
    it('should show word counter in word mode when started', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('words')).toBeInTheDocument()
      })
      
      // Switch to word mode
      fireEvent.click(screen.getByText('words'))
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
      })
      
      // Select 25 words
      fireEvent.click(screen.getByText('25'))
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Start typing
      fireEvent.keyDown(focusable, { key: 't' })
      
      await waitFor(() => {
        // Should show word counter (0 / 25)
        const wordCounter = screen.getByTestId('word-counter')
        expect(wordCounter).toBeInTheDocument()
        expect(wordCounter.textContent).toContain('/ 25')
      })
    })

    it('should show timer in time mode when started', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      // Should be in time mode by default
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Start typing
      fireEvent.keyDown(focusable, { key: 't' })
      
      await waitFor(() => {
        // Should show timer display (not word counter)
        const timerDisplay = screen.getByTestId('timer-display')
        expect(timerDisplay).toBeInTheDocument()
      })
    })

    it('should switch from timer to word counter when mode changes', async () => {
      const { container } = renderPractice()
      
      await waitFor(() => {
        expect(container.querySelector('.typing-text')).toBeInTheDocument()
      })
      
      // Switch to word mode (before starting)
      fireEvent.click(screen.getByText('words'))
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
      })
      
      const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
      
      // Start typing in word mode
      fireEvent.keyDown(focusable, { key: 't' })
      
      await waitFor(() => {
        // Should have word counter, not timer
        expect(screen.getByTestId('word-counter')).toBeInTheDocument()
        expect(screen.queryByTestId('timer-display')).not.toBeInTheDocument()
      })
    })
  })
})
