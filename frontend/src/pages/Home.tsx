import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getLeaderboardByWpm } from '../services/api'
import { LeaderboardEntry } from '../types/api'

const Home = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const users = await getLeaderboardByWpm(5)
        setTopUsers(users)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      }
    }
    fetchTopUsers()
  }, [])

  return (
    <div className="w-full px-6 md:px-10 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          donkey type
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          A minimalist typing test. Practice, compete, improve.
        </p>
        <Link
          to="/practice"
          className="inline-block px-6 py-3 bg-primary text-bg font-semibold rounded-lg hover:bg-primary-hover"
        >
          start typing
        </Link>
      </div>

      {/* Cards Section - Full width grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Leaderboard Preview */}
        <div className="bg-bg-secondary rounded-lg p-6 border border-border">
          <h2 className="text-xl font-bold text-text mb-4">top typists</h2>
          {topUsers.length > 0 ? (
            <ul className="space-y-2">
              {topUsers.map((user, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-bg-tertiary rounded"
                >
                  <div className="flex items-center">
                    <span className={`font-bold mr-3 ${
                      index === 0 
                        ? 'text-primary' 
                        : index === 1 
                        ? 'text-text-secondary' 
                        : index === 2 
                        ? 'text-accent-warning' 
                        : 'text-text-muted'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-text">{user.username}</span>
                  </div>
                  <span className="text-text-secondary font-mono">{user.bestWpm} wpm</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted">No results yet. Be the first!</p>
          )}
          <Link
            to="/leaderboard"
            className="block mt-4 text-center text-primary hover:text-primary-hover font-semibold"
          >
            view full leaderboard →
          </Link>
        </div>

        {/* Features */}
        <div className="bg-bg-secondary rounded-lg p-6 border border-border">
          <h2 className="text-xl font-bold text-text mb-4">features</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start">
              <span className="text-accent-success mr-2">✓</span>
              <span>Real-time typing statistics (WPM, accuracy, errors)</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-2">✓</span>
              <span>Track your progress and personal bests</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-2">✓</span>
              <span>Compete on global leaderboards</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-2">✓</span>
              <span>Practice with diverse text samples</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-2">✓</span>
              <span>Light and dark theme support</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="mt-10 text-center">
        <p className="text-text-muted text-xs">
          <span className="px-1.5 py-0.5 bg-bg-tertiary rounded font-mono">ctrl+enter</span>
          {' '}new test
          <span className="mx-3">|</span>
          <span className="px-1.5 py-0.5 bg-bg-tertiary rounded font-mono">ctrl+shift+k</span>
          {' '}reset
        </p>
      </div>
    </div>
  )
}

export default Home
