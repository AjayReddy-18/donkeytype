import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from '../Home'
import * as api from '../../services/api'

vi.mock('../../services/api')

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render home page with title and description', () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Welcome to Donkey Type')).toBeInTheDocument()
    expect(screen.getByText(/Improve your typing speed/)).toBeInTheDocument()
    expect(screen.getByText('Start Practicing')).toBeInTheDocument()
  })

  it('should fetch and display top users', async () => {
    const mockUsers = [
      { username: 'user1', bestWpm: 100, averageAccuracy: 95.5 },
      { username: 'user2', bestWpm: 80, averageAccuracy: 90.0 },
    ]

    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
      expect(screen.getByText('100 WPM')).toBeInTheDocument()
      expect(screen.getByText('80 WPM')).toBeInTheDocument()
    })
  })

  it('should display empty state when no users', async () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No results yet. Be the first!')).toBeInTheDocument()
    })
  })

  it('should display features list', () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText(/Real-time typing statistics/)).toBeInTheDocument()
    expect(screen.getByText(/Track your progress/)).toBeInTheDocument()
    expect(screen.getByText(/Compete on global leaderboards/)).toBeInTheDocument()
  })

  it('should have link to full leaderboard', async () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      const link = screen.getByText('View Full Leaderboard →')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/leaderboard')
    })
  })

  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getLeaderboardByWpm).mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch leaderboard:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })
})

