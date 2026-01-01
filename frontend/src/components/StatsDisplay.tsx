interface StatsDisplayProps {
  wpm: number
  accuracy: number
  totalErrors: number
  timeSeconds: number
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ wpm, accuracy, totalErrors, timeSeconds }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex justify-center items-center space-x-12">
      <div className="text-center">
        <div className="text-5xl font-bold text-[#60a5fa]">{wpm}</div>
        <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">WPM</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-[#4ade80]">{accuracy.toFixed(1)}%</div>
        <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">Accuracy</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-[#f87171]">{totalErrors}</div>
        <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">Errors</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-300">{formatTime(timeSeconds)}</div>
        <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">Time</div>
      </div>
    </div>
  )
}

export default StatsDisplay
