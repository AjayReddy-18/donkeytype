import React from 'react'

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
    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-primary">{wpm}</div>
        <div className="text-sm text-text-muted mt-3 uppercase tracking-widest">wpm</div>
      </div>
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-accent-success">{accuracy.toFixed(1)}%</div>
        <div className="text-sm text-text-muted mt-3 uppercase tracking-widest">accuracy</div>
      </div>
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-accent-error">{totalErrors}</div>
        <div className="text-sm text-text-muted mt-3 uppercase tracking-widest">errors</div>
      </div>
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-text">{formatTime(timeSeconds)}</div>
        <div className="text-sm text-text-muted mt-3 uppercase tracking-widest">time</div>
      </div>
    </div>
  )
}

export default StatsDisplay
