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
    <div className="w-full px-8 lg:px-16 xl:px-24 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-text mb-6">
          donkey type
        </h1>
        <p className="text-xl text-text-secondary mb-10">
          A minimalist typing test. Practice, compete, improve.
        </p>
        <Link
          to="/practice"
          className="inline-block px-8 py-4 bg-primary text-bg text-lg font-semibold rounded-lg hover:bg-primary-hover"
        >
          start typing
        </Link>
      </div>

      {/* Cards Section - Full width grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Leaderboard Preview */}
        <div className="bg-bg-secondary rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-bold text-text mb-6">top typists</h2>
          {topUsers.length > 0 ? (
            <ul className="space-y-3">
              {topUsers.map((user, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center p-4 bg-bg-tertiary rounded"
                >
                  <div className="flex items-center">
                    <span className={`font-bold mr-4 text-lg ${
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
                    <span className="text-text text-lg">{user.username}</span>
                  </div>
                  <span className="text-text-secondary font-mono text-lg">{user.bestWpm} wpm</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted text-lg">No results yet. Be the first!</p>
          )}
          <Link
            to="/leaderboard"
            className="block mt-6 text-center text-primary hover:text-primary-hover font-semibold text-lg"
          >
            view full leaderboard →
          </Link>
        </div>

        {/* Features */}
        <div className="bg-bg-secondary rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-bold text-text mb-6">features</h2>
          <ul className="space-y-4 text-text-secondary text-lg">
            <li className="flex items-start">
              <span className="text-accent-success mr-3">✓</span>
              <span>Real-time typing statistics (WPM, accuracy, errors)</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-3">✓</span>
              <span>Track your progress and personal bests</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-3">✓</span>
              <span>Compete on global leaderboards</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-3">✓</span>
              <span>Practice with diverse text samples</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent-success mr-3">✓</span>
              <span>Light and dark theme support</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="mt-12 text-center">
        <p className="text-text-muted text-sm">
          <span className="px-2 py-1 bg-bg-tertiary rounded font-mono">ctrl+enter</span>
          {' '}new test
          <span className="mx-4">|</span>
          <span className="px-2 py-1 bg-bg-tertiary rounded font-mono">ctrl+shift+k</span>
          {' '}reset
        </p>
      </div>
    </div>
  )
}

export default Home
