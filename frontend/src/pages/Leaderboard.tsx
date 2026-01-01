import { useState, useEffect } from 'react'
import { getLeaderboardByWpm, getLeaderboardByAccuracy } from '../services/api'
import { LeaderboardEntry } from '../types/api'

type LeaderboardType = 'wpm' | 'accuracy'

const Leaderboard = () => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('wpm')
  const [wpmEntries, setWpmEntries] = useState<LeaderboardEntry[]>([])
  const [accuracyEntries, setAccuracyEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboards()
  }, [])

  const loadLeaderboards = async () => {
    setLoading(true)
    try {
      const [wpmData, accuracyData] = await Promise.all([
        getLeaderboardByWpm(20),
        getLeaderboardByAccuracy(20),
      ])
      setWpmEntries(wpmData)
      setAccuracyEntries(accuracyData)
    } catch (error) {
      console.error('Failed to load leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentEntries = leaderboardType === 'wpm' ? wpmEntries : accuracyEntries

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Leaderboard</h1>

      <div className="flex justify-center mb-8 space-x-4">
        <button
          onClick={() => setLeaderboardType('wpm')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            leaderboardType === 'wpm'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Top WPM
        </button>
        <button
          onClick={() => setLeaderboardType('accuracy')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            leaderboardType === 'accuracy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Top Accuracy
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      ) : currentEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No entries yet. Be the first to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {leaderboardType === 'wpm' ? 'Best WPM' : 'Average Accuracy'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {leaderboardType === 'wpm' ? 'Average Accuracy' : 'Best WPM'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-lg font-bold ${
                        index === 0
                          ? 'text-yellow-500'
                          : index === 1
                          ? 'text-gray-400'
                          : index === 2
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{entry.username}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-blue-600">
                      {leaderboardType === 'wpm'
                        ? `${entry.bestWpm} WPM`
                        : `${entry.averageAccuracy.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {leaderboardType === 'wpm'
                        ? `${entry.averageAccuracy.toFixed(2)}%`
                        : `${entry.bestWpm} WPM`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Leaderboard

