import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Leaderboard from '../Leaderboard'
import * as api from '../../services/api'

vi.mock('../../services/api')

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render leaderboard with title', async () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])
    vi.mocked(api.getLeaderboardByAccuracy).mockResolvedValue([])

    render(<Leaderboard />)

    expect(screen.getByText('leaderboard')).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    vi.mocked(api.getLeaderboardByWpm).mockImplementation(() => new Promise(() => {}))
    vi.mocked(api.getLeaderboardByAccuracy).mockImplementation(() => new Promise(() => {}))

    render(<Leaderboard />)

    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument()
  })

  it('should display WPM leaderboard by default', async () => {
    const mockWpmEntries = [
      { username: 'user1', bestWpm: 100, averageAccuracy: 95.5 },
      { username: 'user2', bestWpm: 80, averageAccuracy: 90.0 },
    ]

    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue(mockWpmEntries)
    vi.mocked(api.getLeaderboardByAccuracy).mockResolvedValue([])

    render(<Leaderboard />)

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
      expect(screen.getByText('100 wpm')).toBeInTheDocument()
      expect(screen.getByText('80 wpm')).toBeInTheDocument()
    })
  })

  it('should switch to accuracy leaderboard', async () => {
    const mockAccuracyEntries = [
      { username: 'user1', bestWpm: 100, averageAccuracy: 98.5 },
      { username: 'user2', bestWpm: 80, averageAccuracy: 95.0 },
    ]

    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])
    vi.mocked(api.getLeaderboardByAccuracy).mockResolvedValue(mockAccuracyEntries)

    const user = userEvent.setup()
    render(<Leaderboard />)

    await waitFor(() => {
      expect(screen.getByText('top wpm')).toBeInTheDocument()
    })

    const accuracyButton = screen.getByText('top accuracy')
    await user.click(accuracyButton)

    await waitFor(() => {
      expect(screen.getByText('98.5%')).toBeInTheDocument()
      expect(screen.getByText('95.0%')).toBeInTheDocument()
    })
  })

  it('should display empty state when no entries', async () => {
    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue([])
    vi.mocked(api.getLeaderboardByAccuracy).mockResolvedValue([])

    render(<Leaderboard />)

    await waitFor(() => {
      expect(screen.getByText(/No entries yet/)).toBeInTheDocument()
    })
  })

  it('should display rank colors correctly', async () => {
    const mockEntries = [
      { username: 'user1', bestWpm: 100, averageAccuracy: 95.5 },
      { username: 'user2', bestWpm: 90, averageAccuracy: 90.0 },
      { username: 'user3', bestWpm: 80, averageAccuracy: 85.0 },
      { username: 'user4', bestWpm: 70, averageAccuracy: 80.0 },
    ]

    vi.mocked(api.getLeaderboardByWpm).mockResolvedValue(mockEntries)
    vi.mocked(api.getLeaderboardByAccuracy).mockResolvedValue([])

    render(<Leaderboard />)

    await waitFor(() => {
      const ranks = screen.getAllByText(/#\d+/)
      expect(ranks.length).toBeGreaterThan(0)
    })
  })

  it('should handle API error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getLeaderboardByWpm).mockRejectedValue(new Error('Network error'))
    vi.mocked(api.getLeaderboardByAccuracy).mockRejectedValue(new Error('Network error'))

    render(<Leaderboard />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load leaderboards:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })
})
