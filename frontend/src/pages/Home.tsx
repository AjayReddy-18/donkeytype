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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Donkey Type
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Improve your typing speed and accuracy with our typing practice platform
        </p>
        <Link
          to="/practice"
          className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Start Practicing
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Typists</h2>
          {topUsers.length > 0 ? (
            <ul className="space-y-3">
              {topUsers.map((user, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-blue-600 mr-3">#{index + 1}</span>
                    <span className="font-semibold text-gray-900">{user.username}</span>
                  </div>
                  <span className="text-gray-600">{user.bestWpm} WPM</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No results yet. Be the first!</p>
          )}
          <Link
            to="/leaderboard"
            className="block mt-6 text-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            View Full Leaderboard →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Real-time typing statistics (WPM, accuracy, errors)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Track your progress and personal bests</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Compete on global leaderboards</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Practice with diverse text samples</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home

