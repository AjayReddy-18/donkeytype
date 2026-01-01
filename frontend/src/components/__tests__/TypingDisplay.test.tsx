import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TypingDisplay from '../TypingDisplay'
import { CharStatus } from '../../utils/typingEngine'

describe('TypingDisplay', () => {
  it('should render text correctly', () => {
    const originalText = 'hello world'
    const typedText = 'hello'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'correct',
      'pending', 'pending', 'pending', 'pending', 'pending', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={5}
        charStatuses={charStatuses}
      />
    )

    expect(container).toBeTruthy()
    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should handle empty text', () => {
    const charStatuses: CharStatus[] = []

    const { container } = render(
      <TypingDisplay
        originalText=""
        typedText=""
        currentIndex={0}
        charStatuses={charStatuses}
      />
    )

    expect(container).toBeTruthy()
    expect(container.textContent).toBe('')
  })

  it('should render all characters', () => {
    const originalText = 'abc'
    const typedText = 'abc'
    const charStatuses: CharStatus[] = ['correct', 'correct', 'correct']

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={3}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('abc')
  })

  it('should handle words with spaces', () => {
    const originalText = 'test word'
    const typedText = 'test'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'pending', 'pending', 'pending', 'pending', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={4}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('test')
    expect(container.textContent).toContain('word')
  })

  it('should handle incorrect characters', () => {
    const originalText = 'hello'
    const typedText = 'hallo'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'incorrect', 'correct', 'correct'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={5}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
  })

  it('should handle current character', () => {
    const originalText = 'hello'
    const typedText = 'hel'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'current', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={3}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
  })

  it('should handle current character with space', () => {
    const originalText = 'hello world'
    const typedText = 'hello'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'correct', 'current', 'pending', 'pending', 'pending', 'pending', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={5}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should handle missing charStatuses entries', () => {
    const originalText = 'hello world'
    const typedText = 'hello'
    // Only provide statuses for first 5 chars, missing for space and 'world'
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'correct'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={5}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should handle empty charStatuses array', () => {
    const originalText = 'test'
    const typedText = ''
    const charStatuses: CharStatus[] = []

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={0}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('test')
  })
})
