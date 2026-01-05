import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Practice from '../Practice'
import * as api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { UserResponse } from '../../types/api'

vi.mock('../../services/api', () => ({
  getTypingText: vi.fn(),
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

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockGetTypingText = api.getTypingText as ReturnType<typeof vi.fn>
const mockSubmitResult = api.submitResult as ReturnType<typeof vi.fn>

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
    mockGetTypingText.mockResolvedValue({ text: 'test text' })
    mockSubmitResult.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show loading state initially', () => {
    mockGetTypingText.mockReturnValue(new Promise(() => {}))
    renderPractice()
    
    expect(screen.getByText('loading...')).toBeInTheDocument()
  })

  it('should load and display typing text', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/test/)).toBeInTheDocument()
    })
  })

  it('should show guest message when not authenticated', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/practicing as guest/)).toBeInTheDocument()
    })
  })

  it('should not show guest message when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuthReturn,
      user: mockUser,
      isAuthenticated: true,
    })
    
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/test/)).toBeInTheDocument()
    })
    
    expect(screen.queryByText(/practicing as guest/)).not.toBeInTheDocument()
  })

  it('should show start typing prompt', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText('click above or start typing...')).toBeInTheDocument()
    })
  })

  it('should show reset and new test buttons initially', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getAllByText('reset').length).toBeGreaterThan(0)
      expect(screen.getAllByText('new test').length).toBeGreaterThan(0)
    })
  })

  it('should load new text when new test button is clicked', async () => {
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/test/)).toBeInTheDocument()
    })
    
    mockGetTypingText.mockClear()
    
    fireEvent.click(screen.getAllByText('new test')[0])
    
    await waitFor(() => {
      expect(mockGetTypingText).toHaveBeenCalled()
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
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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

  it('should show create account link after completion when guest', async () => {
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'a' })
    fireEvent.keyDown(focusable, { key: 'b' })
    
    await waitFor(() => {
      expect(screen.getByText('Create an account')).toBeInTheDocument()
    })
  })

  it('should show Invalid Test for low accuracy', async () => {
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    mockGetTypingText.mockResolvedValue({ text: 'test' })
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
    
    mockGetTypingText.mockClear()
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'Enter', ctrlKey: true })
    
    await waitFor(() => {
      expect(mockGetTypingText).toHaveBeenCalled()
    })
  })

  it('should handle Ctrl+Tab shortcut for new test', async () => {
    const { container } = renderPractice()
    
    await waitFor(() => {
      expect(container.querySelector('.typing-text')).toBeInTheDocument()
    })
    
    mockGetTypingText.mockClear()
    
    const focusable = container.querySelector('[tabindex="0"]') as HTMLElement
    fireEvent.keyDown(focusable, { key: 'Tab', ctrlKey: true })
    
    await waitFor(() => {
      expect(mockGetTypingText).toHaveBeenCalled()
    })
  })

  it('should handle Ctrl+Shift+K shortcut for reset', async () => {
    mockGetTypingText.mockResolvedValue({ text: 'test' })
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
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
    
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
    
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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

  it('should show reset and new test buttons after completion', async () => {
    mockGetTypingText.mockResolvedValue({ text: 'ab' })
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
    expect(screen.getAllByText('new test').length).toBeGreaterThan(0)
  })

  it('should handle getTypingText error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockGetTypingText.mockResolvedValueOnce({ text: 'test' })
    renderPractice()
    
    await waitFor(() => {
      expect(screen.getByText(/test/)).toBeInTheDocument()
    })
    
    mockGetTypingText.mockRejectedValueOnce(new Error('Network error'))
    
    fireEvent.click(screen.getAllByText('new test')[0])
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load text:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
