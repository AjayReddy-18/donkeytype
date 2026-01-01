export interface UserResponse {
  id: number
  username: string
  email: string
  bestWpm: number
  averageAccuracy: number
  totalTests: number
}

export interface TypingTextResponse {
  text: string
  wordCount: number
}

export interface SubmitResultRequest {
  wpm: number
  accuracy: number
  totalErrors: number
  timeSeconds: number
}

export interface LeaderboardEntry {
  username: string
  bestWpm: number
  averageAccuracy: number
}

