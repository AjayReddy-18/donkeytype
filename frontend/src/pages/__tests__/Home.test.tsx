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

    expect(screen.getByText('donkey type')).toBeInTheDocument()
    expect(screen.getByText(/A minimalist typing test/)).toBeInTheDocument()
    expect(screen.getByText('start typing')).toBeInTheDocument()
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
      expect(screen.getByText('100 wpm')).toBeInTheDocument()
      expect(screen.getByText('80 wpm')).toBeInTheDocument()
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

    expect(screen.getByText('features')).toBeInTheDocument()
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
      const link = screen.getByText('view full leaderboard →')
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

  it('should display correct rank colors for positions 1-4', async () => {
    const mockUsers = [
      { username: 'first', bestWpm: 100, averageAccuracy: 95.5 },
      { username: 'second', bestWpm: 90, averageAccuracy: 94.0 },
      { username: 'third', bestWpm: 80, averageAccuracy: 93.0 },
      { username: 'fourth', bestWpm: 70, averageAccuracy: 92.0 },
    ]

    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('first')).toBeInTheDocument()
      expect(screen.getByText('second')).toBeInTheDocument()
      expect(screen.getByText('third')).toBeInTheDocument()
      expect(screen.getByText('fourth')).toBeInTheDocument()
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#4')).toBeInTheDocument()
    })
  })
})
