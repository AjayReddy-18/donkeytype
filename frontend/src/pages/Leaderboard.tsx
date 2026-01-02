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
    <div className="w-full px-6 md:px-10 py-8">
      <h1 className="text-3xl font-bold text-text mb-6">leaderboard</h1>

      {/* Toggle Buttons */}
      <div className="flex mb-6 space-x-2">
        <button
          onClick={() => setLeaderboardType('wpm')}
          className={`px-4 py-2 rounded font-medium ${
            leaderboardType === 'wpm'
              ? 'bg-primary text-bg'
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          top wpm
        </button>
        <button
          onClick={() => setLeaderboardType('accuracy')}
          className={`px-4 py-2 rounded font-medium ${
            leaderboardType === 'accuracy'
              ? 'bg-primary text-bg'
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          top accuracy
        </button>
      </div>

      {loading ? (
        <div className="py-8">
          <p className="text-text-secondary">Loading leaderboard...</p>
        </div>
      ) : currentEntries.length === 0 ? (
        <div className="bg-bg-secondary rounded-lg p-8 border border-border">
          <p className="text-text-secondary">No entries yet. Be the first to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg overflow-hidden border border-border">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {leaderboardType === 'wpm' ? 'Best WPM' : 'Avg Accuracy'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {leaderboardType === 'wpm' ? 'Avg Accuracy' : 'Best WPM'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-bg-tertiary">
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
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
                  <td className="px-4 py-3">
                    <span className="text-text">{entry.username}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-primary font-mono">
                      {leaderboardType === 'wpm'
                        ? `${entry.bestWpm} wpm`
                        : `${entry.averageAccuracy.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary font-mono">
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
