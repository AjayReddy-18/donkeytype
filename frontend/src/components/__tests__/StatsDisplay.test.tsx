import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsDisplay from '../StatsDisplay'

describe('StatsDisplay', () => {
  it('should render all stats correctly', () => {
    render(
      <StatsDisplay
        wpm={75}
        accuracy={85.5}
        totalErrors={3}
        timeSeconds={120}
      />
    )

    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('85.5%')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2:00')).toBeInTheDocument()
    expect(screen.getByText('WPM')).toBeInTheDocument()
    expect(screen.getByText('Accuracy')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })

  it('should format time correctly', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={0}
        totalErrors={0}
        timeSeconds={65}
      />
    )

    expect(screen.getByText('1:05')).toBeInTheDocument()
  })

  it('should format time with leading zeros', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={0}
        totalErrors={0}
        timeSeconds={5}
      />
    )

    expect(screen.getByText('0:05')).toBeInTheDocument()
  })

  it('should display zero values', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={0}
        totalErrors={0}
        timeSeconds={0}
      />
    )

    // Use getAllByText since there are multiple "0" values (WPM and Errors)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2) // WPM and Errors both show 0
    expect(screen.getByText('0.0%')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('should format accuracy with one decimal place', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={95.55}
        totalErrors={0}
        timeSeconds={0}
      />
    )

    // toFixed(1) on 95.55 rounds to 95.5 (due to floating point precision)
    // Check that the accuracy value is displayed (may be 95.5 or 95.6)
    const accuracyDiv = screen.getByText('Accuracy').closest('div')?.previousElementSibling
    expect(accuracyDiv).toBeTruthy()
    const accuracyText = accuracyDiv?.textContent || ''
    expect(accuracyText).toMatch(/95\.[56]%/)
  })

  it('should handle large time values', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={0}
        totalErrors={0}
        timeSeconds={3661}
      />
    )

    expect(screen.getByText('61:01')).toBeInTheDocument()
  })

  it('should handle negative accuracy gracefully', () => {
    render(
      <StatsDisplay
        wpm={0}
        accuracy={-10}
        totalErrors={0}
        timeSeconds={0}
      />
    )

    expect(screen.getByText('-10.0%')).toBeInTheDocument()
  })
})
