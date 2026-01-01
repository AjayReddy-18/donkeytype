import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserResponse, TypingTextResponse, SubmitResultRequest, LeaderboardEntry } from '../../types/api'

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockPost, mockGet } = vi.hoisted(() => {
  return {
    mockPost: vi.fn(),
    mockGet: vi.fn(),
  }
})

// Mock axios module - must be done before importing api
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: mockPost,
      get: mockGet,
    })),
  },
}))

// Import after mocking
import * as api from '../api'

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockClear()
    mockGet.mockClear()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser: UserResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        bestWpm: 0,
        averageAccuracy: 0,
        totalTests: 0,
      }

      mockPost.mockResolvedValue({ data: mockUser })

      const result = await api.register('testuser', 'test@example.com', 'password123')

      expect(result).toEqual(mockUser)
      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle registration errors', async () => {
      mockPost.mockRejectedValue(new Error('Registration failed'))

      await expect(api.register('testuser', 'test@example.com', 'password123')).rejects.toThrow()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: UserResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        bestWpm: 100,
        averageAccuracy: 95.5,
        totalTests: 10,
      }

      mockPost.mockResolvedValue({ data: mockUser })

      const result = await api.login('testuser', 'password123')

      expect(result).toEqual(mockUser)
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      })
    })

    it('should handle login errors', async () => {
      mockPost.mockRejectedValue(new Error('Login failed'))

      await expect(api.login('testuser', 'wrongpassword')).rejects.toThrow()
    })
  })

  describe('getTypingText', () => {
    it('should fetch typing text successfully', async () => {
      const mockResponse: TypingTextResponse = {
        text: 'The quick brown fox',
        wordCount: 4,
      }

      mockGet.mockResolvedValue({ data: mockResponse })

      const result = await api.getTypingText()

      expect(result).toEqual(mockResponse)
      expect(mockGet).toHaveBeenCalledWith('/typing/text')
    })

    it('should handle fetch errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))

      await expect(api.getTypingText()).rejects.toThrow()
    })
  })

  describe('submitResult', () => {
    it('should submit result successfully', async () => {
      const mockRequest: SubmitResultRequest = {
        wpm: 75,
        accuracy: 85.5,
        totalErrors: 3,
        timeSeconds: 120,
      }

      mockPost.mockResolvedValue({ data: {} })

      await api.submitResult(1, mockRequest)

      expect(mockPost).toHaveBeenCalledWith('/typing/submit/1', mockRequest)
    })

    it('should handle submit errors', async () => {
      mockPost.mockRejectedValue(new Error('Submit failed'))

      const mockRequest: SubmitResultRequest = {
        wpm: 75,
        accuracy: 85.5,
        totalErrors: 3,
        timeSeconds: 120,
      }

      await expect(api.submitResult(1, mockRequest)).rejects.toThrow()
    })
  })

  describe('getLeaderboardByWpm', () => {
    it('should fetch leaderboard by WPM successfully', async () => {
      const mockEntries: LeaderboardEntry[] = [
        { username: 'user1', bestWpm: 100, averageAccuracy: 95.5 },
        { username: 'user2', bestWpm: 80, averageAccuracy: 90.0 },
      ]

      mockGet.mockResolvedValue({ data: mockEntries })

      const result = await api.getLeaderboardByWpm(10)

      expect(result).toEqual(mockEntries)
      expect(mockGet).toHaveBeenCalledWith('/leaderboard/wpm?limit=10')
    })

    it('should use default limit when not provided', async () => {
      mockGet.mockResolvedValue({ data: [] })

      await api.getLeaderboardByWpm()

      expect(mockGet).toHaveBeenCalledWith('/leaderboard/wpm?limit=10')
    })
  })

  describe('getLeaderboardByAccuracy', () => {
    it('should fetch leaderboard by accuracy successfully', async () => {
      const mockEntries: LeaderboardEntry[] = [
        { username: 'user1', bestWpm: 100, averageAccuracy: 98.5 },
        { username: 'user2', bestWpm: 80, averageAccuracy: 95.0 },
      ]

      mockGet.mockResolvedValue({ data: mockEntries })

      const result = await api.getLeaderboardByAccuracy(5)

      expect(result).toEqual(mockEntries)
      expect(mockGet).toHaveBeenCalledWith('/leaderboard/accuracy?limit=5')
    })
  })
})
