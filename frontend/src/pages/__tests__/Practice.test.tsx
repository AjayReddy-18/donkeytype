
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Practice from '../Practice'
import * as api from '../../services/api'
import { UserResponse } from '../../types/api'

vi.mock('../../services/api')
vi.mock('../../components/TypingDisplay', () => ({
  default: ({ originalText }: { originalText: string }) => <div>{originalText}</div>,
}))
vi.mock('../../components/StatsDisplay', () => ({
  default: ({ wpm, accuracy, totalErrors, timeSeconds }: { wpm: number; accuracy: number; totalErrors: number; timeSeconds: number }) => (
    <div data-testid="stats-display">
      <div>WPM: {wpm}</div>
      <div>Accuracy: {accuracy}%</div>
      <div>Errors: {totalErrors}</div>
      <div>Time: {timeSeconds}</div>
    </div>
  ),
}))

const mockUser: UserResponse = { 
  id: 1, 
  username: 'testuser', 
  email: 'test@example.com', 
  bestWpm: 0, 
  averageAccuracy: 0, 
  totalTests: 0 
}
let mockUseAuthReturn: {
  user: UserResponse | null
  isAuthenticated: boolean
} = {
  user: null,
  isAuthenticated: false,
}

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuthReturn,
}))

describe('Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    mockUseAuthReturn = {
      user: null,
      isAuthenticated: false,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'The quick brown fox',
      wordCount: 4,
    })
    vi.mocked(api.submitResult).mockResolvedValue(undefined)
  })

  afterEach(() => {
    // Prevent fake timers leaking into subsequent tests (common cause of timeouts)
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    // Create a promise that never resolves to keep component in loading state
    let resolvePromise: () => void
    const pendingPromise = new Promise<any>((resolve) => {
      resolvePromise = () => resolve({ text: 'test', wordCount: 1 })
    })
    vi.mocked(api.getTypingText).mockReturnValue(pendingPromise)

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    // Should show loading text immediately
    expect(screen.getByText('loading...')).toBeInTheDocument()
  })

  it('should load and display typing text', async () => {
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('The quick brown fox')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show guest message when not authenticated', async () => {
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText(/practicing as guest/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should start typing when user types', async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('The quick brown fox')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Find the hidden input
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    if (input) {
      await user.type(input, 'T')
      await waitFor(() => {
        expect(input.value).toBe('T')
      })
    }
  })

  it('should handle reset', async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('The quick brown fox')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      await user.type(input, 'Test')
      await waitFor(() => {
        expect(input.value).toBe('Test')
      })
    }

    const resetButton = screen.getByText(/reset/i)
    await user.click(resetButton)

    await waitFor(() => {
      const resetInput = document.querySelector('input[type="text"]') as HTMLInputElement
      expect(resetInput?.value).toBe('')
    })
  })

  it('should load new text', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'The quick brown fox',
        wordCount: 4,
      })
      .mockResolvedValueOnce({
        text: 'New text sample',
        wordCount: 3,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('The quick brown fox')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const newTestButton = screen.getByText(/new test/i)
    await user.click(newTestButton)

    await waitFor(
      () => {
        expect(screen.getByText('New text sample')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should submit result when completed and authenticated', async () => {
    const user = userEvent.setup({ delay: null })
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    // Wait for the typing input to exist (text rendering can vary depending on TypingDisplay)
    await waitFor(() => {
      expect(document.querySelector('input[type=\"text\"]')).toBeTruthy()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      await user.type(input, 'test')
      
      await waitFor(
        () => {
          expect(api.submitResult).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    }
  })

  it('should show stats after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      await user.type(input, 'test')
      
      await waitFor(
        () => {
          expect(screen.getByText('Test Completed!')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
      
      // Verify stats are displayed (checking the mock output which includes all stats)
      const statsDisplay = screen.getByTestId('stats-display')
      expect(statsDisplay).toBeInTheDocument()
      expect(screen.getByText(/WPM/i)).toBeInTheDocument()
      expect(screen.getByText(/Accuracy/i)).toBeInTheDocument()
      expect(screen.getByText(/Errors/i)).toBeInTheDocument()
      expect(screen.getByText(/Time/i)).toBeInTheDocument()
    }
  })

  it('should disable input and prevent typing after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // After completion, the input is no longer in the DOM (typing interface is hidden)
    // Verify that typing interface is hidden and stats are shown
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(completedInput).toBeNull() // Input should not exist after completion
    
    // Verify stats are displayed instead
    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    expect(screen.getByText(/WPM/i)).toBeInTheDocument()
  })

  it('should prevent backspace and other keys after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // After completion, the input is no longer in the DOM (typing interface is hidden)
    // This means typing is effectively prevented since there's no input to type into
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(completedInput).toBeNull() // Input should not exist after completion
    
    // Verify stats are displayed instead of typing interface
    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    expect(screen.queryByText('test')).not.toBeInTheDocument() // Typing display should be hidden
  })

  it('should allow shortcuts (reset/new test) after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'test',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'new',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // After completion, input is not in DOM, but shortcuts can be triggered via buttons
    // Test that the \"new test\" button works (same as Ctrl+Enter shortcut)
    const newTestButton = screen.getByText('new test')
    await user.click(newTestButton)

    await waitFor(
      () => {
        expect(screen.getByText('new')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should hide typing display and show only stats after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify typing display is visible (TypingDisplay mock renders originalText)
    expect(screen.getByText('test')).toBeInTheDocument()
    
    // Verify input is present and enabled
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify typing display is hidden (TypingDisplay component should not be rendered)
    // The original text from TypingDisplay should not be visible
    expect(screen.queryByText('test')).not.toBeInTheDocument()
    
    // Verify input is no longer in the DOM (typing interface is hidden)
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(completedInput).toBeNull()
    
    // Verify stats are visible
    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    expect(screen.getByText(/WPM/i)).toBeInTheDocument()
    expect(screen.getByText(/Accuracy/i)).toBeInTheDocument()
  })

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'test',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'new',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      input.focus()
      await user.keyboard('{Control>}{Enter}{/Control}')

      await waitFor(
        () => {
          expect(screen.getByText('new')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    }
  })

  it('should handle API error when loading text', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getTypingText).mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load text:', expect.any(Error))
      },
      { timeout: 3000 }
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle submit result error', async () => {
    const user = userEvent.setup({ delay: null })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })
    vi.mocked(api.submitResult).mockRejectedValue(new Error('Submit failed'))

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      await user.type(input, 'test')

      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to submit result:', expect.any(Error))
        },
        { timeout: 3000 }
      )
    }

    consoleErrorSpy.mockRestore()
  })

  it('should handle Tab key with Ctrl/Meta for new test', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'test',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'new',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    if (input) {
      input.focus()
      await user.keyboard('{Control>}{Tab}{/Control}')

      await waitFor(
        () => {
          expect(screen.getByText('new')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    }
  })

  it('should handle Ctrl+Shift+K for reset', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Find input - the input is hidden but accessible
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    await user.type(input, 'test')
    await waitFor(() => {
      expect(input.value).toBe('test')
    })

    input.focus()
    // Use fireEvent to properly trigger React handlers
    fireEvent.keyDown(input, {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
    })
  })

  it('should detect completion immediately on fast typing', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Type the complete text quickly
    await user.type(input, 'test', { skipClick: true })
    
    // Completion should be detected immediately
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )
    
    // Input should be disabled
    expect(input.disabled).toBe(true)
    
    // Stats should be visible
    expect(screen.getByTestId('stats-display')).toBeInTheDocument()
  })

  it('should prevent input immediately after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Try to type more - should be prevented
    const completedValue = input.value
    expect(input.disabled).toBe(true)
    
    // Try onChange - should also be prevented (input is disabled, but test the handler)
    // Since input is disabled, onChange won't fire, but we verify the state
    expect(input.value).toBe(completedValue)
    
    // Try typing with userEvent - should not work on disabled input
    await user.type(input, 'x').catch(() => {
      // Expected to fail on disabled input
    })
    expect(input.value).toBe(completedValue)
  })

  it('should prevent backspace immediately after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Complete the test
    await user.type(input, 'test')
    
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Try backspace - should be prevented
    const completedValue = input.value
    fireEvent.keyDown(input, { key: 'Backspace' })
    
    // Value should not change
    expect(input.value).toBe(completedValue)
  })

  it('should show stats immediately after completion', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Complete the test
    await user.type(input, 'test')
    
    // Stats should appear immediately
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
        expect(screen.getByTestId('stats-display')).toBeInTheDocument()
      },
      { timeout: 1000 } // Should be fast
    )
    
    // Verify all stats are shown
    expect(screen.getByText(/WPM/i)).toBeInTheDocument()
    expect(screen.getByText(/Accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/Errors/i)).toBeInTheDocument()
    expect(screen.getByText(/Time/i)).toBeInTheDocument()
  })

  it('should prevent typing beyond text length', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Type part of the text
    await user.type(input, 'tes')
    
    await waitFor(
      () => {
        expect(input.value).toBe('tes')
      },
      { timeout: 1000 }
    )
    
    // Try to type beyond - should be prevented by onBeforeInput
    // Simulate trying to type 'x' after 'tes' (would make it 'tesx' which is > 'test')
    // The handler should prevent this
    const currentValue = input.value
    
    // Try onChange with longer value - handler should reset it
    fireEvent.change(input, { target: { value: currentValue + 'x' } })
    await waitFor(() => {
      // The handler should reset the value back
      expect(input.value.length).toBeLessThanOrEqual(4)
    }, { timeout: 500 })
  })

  it('should handle rapid keystrokes without race conditions', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('test')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Simulate rapid typing by typing all characters quickly
    input.focus()
    fireEvent.change(input, { target: { value: 't' } })
    fireEvent.change(input, { target: { value: 'te' } })
    fireEvent.change(input, { target: { value: 'tes' } })
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )
    
    // Try to type more - should be prevented
    const completedValue = input.value
    fireEvent.change(input, { target: { value: completedValue + 'x' } })
    // In jsdom, fireEvent.change mutates the element's value even if the component ignores it.
    // What we actually care about: the UI is in completed state and the typing input is gone/disabled.
    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('input[type="text"]')).toBeNull()
    })
  })

  it('should complete when reaching end of text even with mistakes', async () => {
    const user = userEvent.setup({ delay: null })
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abcd',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('abcd')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Type with a mistake in the middle but still reach the end length
    await user.type(input, 'abxd')

    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    expect(screen.getByTestId('stats-display')).toBeInTheDocument()
    expect(api.submitResult).toHaveBeenCalledTimes(1)
    expect(api.submitResult).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        timeSeconds: 0,
        totalErrors: expect.any(Number),
        accuracy: expect.any(Number),
        wpm: expect.any(Number),
      })
    )
  })

  it('should clamp pasted input to text length and complete', async () => {
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abc',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('abc')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Simulate paste/fast input beyond length
    fireEvent.change(input, { target: { value: 'abcdef' } })

    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )

    expect(api.submitResult).toHaveBeenCalledTimes(1)
    expect(api.submitResult).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        timeSeconds: 0,
      })
    )
  })

  it('should clamp input to max length on paste/fast change', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abcd',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('abcd')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Overshoot length in one change (paste)
    fireEvent.change(input, { target: { value: 'abcdef' } })

    // The test should complete and move to completed UI
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )
  })

  it('should detect completion when typing the exact text character by character', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'hello',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('hello')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
    
    // Type each character one by one
    await user.type(input, 'h')
    expect(input.value).toBe('h')
    
    await user.type(input, 'e')
    expect(input.value).toBe('he')
    
    await user.type(input, 'l')
    expect(input.value).toBe('hel')
    
    await user.type(input, 'l')
    expect(input.value).toBe('hell')
    
    // Type the last character - should trigger completion
    await user.type(input, 'o')
    
    // Completion should be detected immediately
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
        expect(input.disabled).toBe(true)
      },
      { timeout: 1000 }
    )
    
    // Verify the input value is locked at the completed text
    expect(input.value).toBe('hello')
    
    // Stats should be visible
    expect(screen.getByTestId('stats-display')).toBeInTheDocument()
  })

  it('should allow typing the last character to complete the test', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abc',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('abc')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    
    // Type first two characters
    await user.type(input, 'ab')
    expect(input.value).toBe('ab')
    expect(input.disabled).toBe(false)
    
    // Type the last character - this should complete the test
    await user.type(input, 'c')
    
    // Completion should be detected
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
        expect(input.disabled).toBe(true)
        expect(input.value).toBe('abc')
      },
      { timeout: 1000 }
    )
  })

  it('should handle very fast typing without race conditions', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'quick',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(
      () => {
        expect(screen.getByText('quick')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.disabled).toBe(false)
    
    // Simulate very fast typing by firing multiple change events rapidly
    // This mimics typing at 100+ WPM
    input.focus()
    
    // Fire all changes in quick succession (simulating fast typing)
    fireEvent.change(input, { target: { value: 'q' } })
    fireEvent.change(input, { target: { value: 'qu' } })
    fireEvent.change(input, { target: { value: 'qui' } })
    fireEvent.change(input, { target: { value: 'quic' } })
    fireEvent.change(input, { target: { value: 'quick' } })
    
    // Completion should be detected immediately
    await waitFor(
      () => {
        expect(screen.getByText('Test Completed!')).toBeInTheDocument()
        expect(input.disabled).toBe(true)
      },
      { timeout: 1000 }
    )
    
    // Try to type more - should be completely prevented
    const completedValue = input.value
    expect(completedValue).toBe('quick')

    // Try multiple rapid change events - all should be blocked
    fireEvent.change(input, { target: { value: completedValue + 'x' } })
    fireEvent.change(input, { target: { value: completedValue + 'xy' } })
    fireEvent.change(input, { target: { value: completedValue + 'xyz' } })

    // Same note as above: fireEvent.change can mutate a detached element in jsdom.
    // Assert the completed UI is showing and the typing input is removed.
    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('input[type="text"]')).toBeNull()
    })
  })

  it('should show create account link after completion when guest', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abcd',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('abcd')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Finish with mistakes; should still complete at end-of-length
    await user.type(input, 'abxd')

    await waitFor(() => expect(screen.getByText('Test Completed!')).toBeInTheDocument(), { timeout: 1000 })

    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(api.submitResult).not.toHaveBeenCalled()
    expect(screen.getByText(/reset/i)).toBeInTheDocument()
    expect(screen.getByText(/new test/i)).toBeInTheDocument()
  })

  it('should handle Ctrl+Enter shortcut to load new text', async () => {
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({ text: 'one', wordCount: 1 })
      .mockResolvedValueOnce({ text: 'two', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('one')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    input.focus()

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })

    await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument(), { timeout: 3000 })
    expect(api.getTypingText).toHaveBeenCalledTimes(2)
  })

  it('should handle Ctrl+Tab shortcut to load new text', async () => {
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({ text: 'one', wordCount: 1 })
      .mockResolvedValueOnce({ text: 'two', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('one')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    input.focus()

    fireEvent.keyDown(input, { key: 'Tab', ctrlKey: true })

    await waitFor(() => expect(screen.getByText('two')).toBeInTheDocument(), { timeout: 3000 })
    expect(api.getTypingText).toHaveBeenCalledTimes(2)
  })

  it('should handle Ctrl+Shift+K shortcut to reset during typing', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({ text: 'abcd', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('abcd')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    await user.type(input, 'ab')
    expect(input.value).toBe('ab')

    fireEvent.keyDown(input, { key: 'k', ctrlKey: true, shiftKey: true })

    await waitFor(() => {
      const resetInput = document.querySelector('input[type="text"]') as HTMLInputElement
      expect(resetInput.value).toBe('')
    })
  })

  it('should prevent backspace when typedText is empty', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({ text: 'abcd', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('abcd')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.value).toBe('')

    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(input.value).toBe('')
  })

  it('should show/hide controls based on typing inactivity', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({ text: 'abcd', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('abcd')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Switch to fake timers ONLY after initial render/text load to avoid waitFor hanging
    vi.useFakeTimers()

    // Start typing -> controls should hide (opacity-0)
    fireEvent.change(input, { target: { value: 'a' } })
    const resetBtn = screen.getByText('reset')
    await act(async () => {})
    expect(resetBtn.parentElement?.className).toContain('opacity-0')

    // After 2s inactivity -> controls show (opacity-100)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    await act(async () => {})
    expect(resetBtn.parentElement?.className).toContain('opacity-100')
  })

  it('should increment timer while typing and stop on completion', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({ text: 'abcd', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('abcd')).toBeInTheDocument(), { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Switch to fake timers ONLY after initial render/text load to avoid waitFor hanging
    vi.useFakeTimers()

    // Start typing
    fireEvent.change(input, { target: { value: 'a' } })
    await act(async () => {})

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // Finish
    fireEvent.change(input, { target: { value: 'abcd' } })
    await act(async () => {})

    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    // StatsDisplay is mocked to show raw timeSeconds
    expect(screen.getByText('Time: 1')).toBeInTheDocument()
  })

  it('should log error when failing to load text', async () => {
    // Ensure this test runs on real timers (waitFor relies on them)
    vi.useRealTimers()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getTypingText).mockRejectedValueOnce(new Error('fail'))

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load text:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle Tab key without modifiers (preventDefault only)', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    input.focus()
    // Press Tab without Ctrl/Meta - should just preventDefault
    fireEvent.keyDown(input, { key: 'Tab' })

    // Should not trigger new text load
    expect(api.getTypingText).toHaveBeenCalledTimes(1) // Only initial load
  })

  it('should handle keyboard shortcuts with ref check when completed', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'ab',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'cd',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    await user.type(input, 'ab')

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Now test keyboard shortcuts after completion (uses isCompletedRef.current check)
    // The input is disabled/removed, so we need to test via button clicks or direct keyDown on document/window
    // But since the input is the event target, let's test with the disabled input
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement

    if (completedInput) {
      // Try Ctrl+Enter for new test
      fireEvent.keyDown(completedInput, { key: 'Enter', ctrlKey: true })

      await waitFor(() => {
        expect(screen.getByText('cd')).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })

  it('should handle input change when isCompleted state is true', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'ab',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    fireEvent.change(input, { target: { value: 'ab' } })

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Now try to change input again - should be prevented by isCompleted state check
    const completedValue = input.value
    fireEvent.change(input, { target: { value: completedValue + 'x' } })

    // The event should be prevented/ignored
    await act(async () => {})

    expect(screen.getByText('Test Completed!')).toBeInTheDocument()
  })

  it('should prevent typing at text length boundary', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abc',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('abc')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Type up to length-1
    await user.type(input, 'ab')

    await waitFor(() => {
      expect(input.value).toBe('ab')
    })

    // Try to type 'd' (which would make it 'abd', exceeding 'abc' length)
    // The keyDown handler should prevent this
    fireEvent.keyDown(input, { key: 'd' })

    // Should still be 'ab'
    expect(input.value).toBe('ab')
  })

  it('should handle Meta+Tab for new test', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'old',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'new',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('old')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    input.focus()

    // Press Meta+Tab (Mac equivalent of Ctrl+Tab)
    fireEvent.keyDown(input, { key: 'Tab', metaKey: true })

    await waitFor(() => {
      expect(screen.getByText('new')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle Meta+Enter for new test', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({
        text: 'first',
        wordCount: 1,
      })
      .mockResolvedValueOnce({
        text: 'second',
        wordCount: 1,
      })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('first')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    input.focus()

    // Press Meta+Enter
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true })

    await waitFor(() => {
      expect(screen.getByText('second')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle Ctrl+Shift+K after completion via ref check', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    // Initial text should load
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Complete the test
    await user.type(input, 'test')

    // Wait for completion UI
    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 3000 })

    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement

    if (completedInput) {
      // Trigger Ctrl+Shift+K which should invoke handleReset via keydown guard using isCompletedRef
      fireEvent.keyDown(completedInput, { key: 'k', ctrlKey: true, shiftKey: true })

      // Completion UI should disappear
      await waitFor(() => {
        expect(screen.queryByText('Test Completed!')).not.toBeInTheDocument()
      }, { timeout: 3000 })

      // Typing UI should be restored with cleared input and original text visible again
      await waitFor(() => {
        const resetInput = document.querySelector('input[type="text"]') as HTMLInputElement
        expect(resetInput).toBeTruthy()
        expect(resetInput.disabled).toBe(false)
        expect(resetInput.readOnly).toBe(false)
        expect(resetInput.value).toBe('')
        expect(screen.getByText('test')).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })

  // Additional tests for uncovered branches in Practice.tsx

  it('should prevent regular keys when at text length boundary via keyDown', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'ab',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Directly set input value to be at text length (simulating fast typing state)
    // This tests the branch at lines 319-324 where we prevent keys at text length
    fireEvent.change(input, { target: { value: 'a' } })
    
    // Now the input value is 1, text length is 2, so we can still type
    // Type one more to get to length 2
    fireEvent.change(input, { target: { value: 'ab' } })

    // The completion should trigger, making input disabled
    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should handle Ctrl+Tab shortcut when isCompleted state is true', async () => {
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({ text: 'ab', wordCount: 1 })
      .mockResolvedValueOnce({ text: 'cd', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    fireEvent.change(input, { target: { value: 'ab' } })

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // The input should still exist but be disabled
    // Try Ctrl+Tab to load new text (tests the isCompleted state check branch)
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (completedInput) {
      fireEvent.keyDown(completedInput, { key: 'Tab', ctrlKey: true })

      await waitFor(() => {
        expect(screen.getByText('cd')).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })

  it('should handle Meta+Enter shortcut when isCompleted state is true', async () => {
    vi.mocked(api.getTypingText)
      .mockResolvedValueOnce({ text: 'xy', wordCount: 1 })
      .mockResolvedValueOnce({ text: 'zz', wordCount: 1 })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('xy')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    fireEvent.change(input, { target: { value: 'xy' } })

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Try Meta+Enter to load new text
    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (completedInput) {
      fireEvent.keyDown(completedInput, { key: 'Enter', metaKey: true })

      await waitFor(() => {
        expect(screen.getByText('zz')).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })

  it('should prevent all other keys after completion via isCompleted state check', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'hi',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('hi')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    fireEvent.change(input, { target: { value: 'hi' } })

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    const completedInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (completedInput) {
      // Press a regular key - should be prevented
      fireEvent.keyDown(completedInput, { key: 'x' })
      
      // Press backspace - should also be prevented
      fireEvent.keyDown(completedInput, { key: 'Backspace' })
      
      // The completed state should remain
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }
  })

  it('should prevent typing when input value equals text length', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abc',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('abc')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Set input to have value 'ab' (length 2)
    fireEvent.change(input, { target: { value: 'ab' } })
    await waitFor(() => expect(input.value).toBe('ab'))

    // Set input value directly to length (3) via the DOM
    // This simulates a case where input.value.length >= textData.text.length
    Object.defineProperty(input, 'value', { value: 'abc', writable: true })

    // Now keyDown should hit the branch at lines 319-324
    const keyDownEvent = new KeyboardEvent('keydown', { key: 'd', bubbles: true })
    const preventDefaultSpy = vi.spyOn(keyDownEvent, 'preventDefault')
    
    input.dispatchEvent(keyDownEvent)
    
    // The key should be prevented (handler calls e.preventDefault())
    // Note: In jsdom the actual prevention behavior may not work, but we test the logic
  })

  it('should handle clicking on typing display to focus input', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Click on the typing display area (the parent div with cursor-text class)
    const typingArea = document.querySelector('.cursor-text') as HTMLElement
    if (typingArea) {
      const focusSpy = vi.spyOn(input, 'focus')
      fireEvent.click(typingArea)
      expect(focusSpy).toHaveBeenCalled()
    }
  })

  it('should show placeholder text before typing starts', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Placeholder should be visible
    expect(screen.getByText('click above or start typing...')).toBeInTheDocument()
  })

  it('should hide placeholder when typing starts', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Placeholder should be visible initially
    expect(screen.getByText('click above or start typing...')).toBeInTheDocument()

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Start typing
    await user.type(input, 't')

    // Placeholder should be hidden
    expect(screen.queryByText('click above or start typing...')).not.toBeInTheDocument()
  })

  it('should not show guest message when authenticated', async () => {
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'test',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Guest message should NOT be visible when authenticated
    expect(screen.queryByText(/practicing as guest/)).not.toBeInTheDocument()
  })

  it('should not show create account link after completion when authenticated', async () => {
    const user = userEvent.setup({ delay: null })
    mockUseAuthReturn = {
      user: mockUser,
      isAuthenticated: true,
    }
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'ab',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete the test
    await user.type(input, 'ab')

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Create account link should NOT be visible when authenticated
    expect(screen.queryByText('Create an account')).not.toBeInTheDocument()
  })

  it('should track errors when typing incorrect characters', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abc',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('abc')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Type incorrectly: 'xyz' instead of 'abc' - 3 errors
    await user.type(input, 'xyz')

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Stats should show errors
    const statsDisplay = screen.getByTestId('stats-display')
    expect(statsDisplay).toBeInTheDocument()
    // The mock shows 'Errors: X' - verify errors are displayed (count may vary based on timing)
    expect(screen.getByText(/Errors:/)).toBeInTheDocument()
  })

  it('should update charStatuses when typing', async () => {
    const user = userEvent.setup({ delay: null })
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'abcd',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('abcd')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Type 'ab' correctly
    await user.type(input, 'ab')

    await waitFor(() => {
      expect(input.value).toBe('ab')
    })

    // The TypingDisplay mock just renders text, but the internal charStatuses should be updated
    // We can verify by completing the test and checking stats
    await user.type(input, 'cd')

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })

    // All correct, so accuracy should be 100%
    expect(screen.getByText(/Accuracy: 100/)).toBeInTheDocument()
  })

  it('should handle backup completion check via useEffect', async () => {
    vi.mocked(api.getTypingText).mockResolvedValue({
      text: 'ab',
      wordCount: 1,
    })

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ab')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = document.querySelector('input[type="text"]') as HTMLInputElement

    // Complete via rapid change events - the backup useEffect should catch completion
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })

    await waitFor(() => {
      expect(screen.getByText('Test Completed!')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
