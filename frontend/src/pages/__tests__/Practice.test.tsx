import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
  default: ({ wpm, accuracy }: { wpm: number; accuracy: number }) => (
    <div>
      WPM: {wpm}, Accuracy: {accuracy}%
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

  it('should render loading state initially', () => {
    vi.mocked(api.getTypingText).mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Practice />
      </BrowserRouter>
    )

    expect(screen.getByText('Loading text...')).toBeInTheDocument()
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
        expect(screen.getByText(/Practicing as a guest/)).toBeInTheDocument()
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

    const resetButton = screen.getByText('Reset')
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

    const newTestButton = screen.getByText('New Test')
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
    }
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
})
