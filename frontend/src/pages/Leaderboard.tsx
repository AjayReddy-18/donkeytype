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
    <div className="w-full px-8 lg:px-16 xl:px-24 py-12">
      <h1 className="text-4xl font-bold text-text mb-8">leaderboard</h1>

      {/* Toggle Buttons */}
      <div className="flex mb-8 space-x-3">
        <button
          onClick={() => setLeaderboardType('wpm')}
          className={`px-6 py-3 rounded text-lg font-medium ${
            leaderboardType === 'wpm'
              ? 'bg-primary text-bg'
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          top wpm
        </button>
        <button
          onClick={() => setLeaderboardType('accuracy')}
          className={`px-6 py-3 rounded text-lg font-medium ${
            leaderboardType === 'accuracy'
              ? 'bg-primary text-bg'
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          top accuracy
        </button>
      </div>

      {loading ? (
        <div className="py-10">
          <p className="text-text-secondary text-lg">Loading leaderboard...</p>
        </div>
      ) : currentEntries.length === 0 ? (
        <div className="bg-bg-secondary rounded-lg p-10 border border-border">
          <p className="text-text-secondary text-lg">No entries yet. Be the first to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg overflow-hidden border border-border">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                  {leaderboardType === 'wpm' ? 'Best WPM' : 'Avg Accuracy'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                  {leaderboardType === 'wpm' ? 'Avg Accuracy' : 'Best WPM'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-bg-tertiary">
                  <td className="px-6 py-4">
                    <span
                      className={`font-bold text-lg ${
                        index === 0
                          ? 'text-primary'
                          : index === 1
                          ? 'text-text-secondary'
                          : index === 2
                          ? 'text-accent-warning'
                          : 'text-text-muted'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text text-lg">{entry.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary font-mono text-lg">
                      {leaderboardType === 'wpm'
                        ? `${entry.bestWpm} wpm`
                        : `${entry.averageAccuracy.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-secondary font-mono text-lg">
                      {leaderboardType === 'wpm'
                        ? `${entry.averageAccuracy.toFixed(1)}%`
                        : `${entry.bestWpm} wpm`}
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
