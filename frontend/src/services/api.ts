import axios from 'axios'
import { UserResponse, TypingTextResponse, SubmitResultRequest, LeaderboardEntry } from '../types/api'

const API_BASE_URL = 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const register = async (username: string, email: string, password: string): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>('/auth/register', {
    username,
    email,
    password,
  })
  return response.data
}

export const login = async (username: string, password: string): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>('/auth/login', {
    username,
    password,
  })
  return response.data
}

export const getTypingText = async (): Promise<TypingTextResponse> => {
  const response = await apiClient.get<TypingTextResponse>('/typing/text')
  return response.data
}

export const submitResult = async (userId: number, result: SubmitResultRequest): Promise<void> => {
  await apiClient.post(`/typing/submit/${userId}`, result)
}

export const getLeaderboardByWpm = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get<LeaderboardEntry[]>(`/leaderboard/wpm?limit=${limit}`)
  return response.data
}

export const getLeaderboardByAccuracy = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get<LeaderboardEntry[]>(`/leaderboard/accuracy?limit=${limit}`)
  return response.data
}

