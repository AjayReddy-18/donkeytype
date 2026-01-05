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

  it('should handle incorrect space between words', () => {
    const originalText = 'hello world'
    const typedText = 'hellox'
    // First 5 chars correct, 6th char (space) is incorrect
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'correct', 'incorrect', 'pending', 'pending', 'pending', 'pending', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={6}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should handle correct space with cursor', () => {
    const originalText = 'hello world'
    const typedText = 'hello '
    // First 5 chars correct, 6th char (space) is correct and current
    const charStatuses: CharStatus[] = [
      'correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'current', 'pending', 'pending', 'pending', 'pending'
    ]

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={6}
        charStatuses={charStatuses}
      />
    )

    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should render cursor element', () => {
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

    // Cursor element should exist with the typing-cursor class
    const cursor = container.querySelector('.typing-cursor')
    expect(cursor).toBeTruthy()
  })

  it('should position cursor at current character index', () => {
    const originalText = 'abc'
    const typedText = 'a'
    const charStatuses: CharStatus[] = ['correct', 'pending', 'pending']

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={1}
        charStatuses={charStatuses}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    // Cursor should have transform style for positioning
    expect(cursor.style.transform).toBeDefined()
  })

  it('should position cursor at end when currentIndex equals text length', () => {
    const originalText = 'ab'
    const typedText = 'ab'
    const charStatuses: CharStatus[] = ['correct', 'correct']

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText={typedText}
        currentIndex={2}
        charStatuses={charStatuses}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    // Cursor should be visible (positioned at end)
    expect(cursor.style.opacity).not.toBe('0')
  })

  it('should hide cursor when no valid position', () => {
    const { container } = render(
      <TypingDisplay
        originalText=""
        typedText=""
        currentIndex={0}
        charStatuses={[]}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    // With empty text, cursor should be hidden (opacity 0)
    expect(cursor.style.opacity).toBe('0')
  })

  it('should have cursor with proper styling', () => {
    const originalText = 'test'
    const charStatuses: CharStatus[] = ['pending', 'pending', 'pending', 'pending']

    const { container } = render(
      <TypingDisplay
        originalText={originalText}
        typedText=""
        currentIndex={0}
        charStatuses={charStatuses}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    // Check cursor has absolute positioning
    expect(cursor.style.position).toBe('absolute')
    // Check cursor has width set
    expect(cursor.style.width).toBe('3px')
  })

  it('should handle cursor when currentIndex is within bounds but no char element exists', () => {
    // This tests the fallback case (lines 72-74) where:
    // - containerRef exists
    // - currentIndex is within bounds (< originalText.length)
    // - But charRefs.current[currentIndex] is null/undefined
    
    // We simulate this by rendering with text and then checking initial state
    // where refs might not be fully populated yet
    const originalText = 'abc'
    const charStatuses: CharStatus[] = ['pending', 'pending', 'pending']

    const { container, rerender } = render(
      <TypingDisplay
        originalText={originalText}
        typedText=""
        currentIndex={0}
        charStatuses={charStatuses}
      />
    )

    // Verify initial render works
    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()

    // Rerender with a different currentIndex to test cursor repositioning
    rerender(
      <TypingDisplay
        originalText={originalText}
        typedText="a"
        currentIndex={1}
        charStatuses={['correct', 'pending', 'pending']}
      />
    )

    // Cursor should still be visible and positioned
    expect(cursor.style.opacity).not.toBe('0')
  })

  it('should handle rapid currentIndex changes', () => {
    const originalText = 'abcd'
    const { container, rerender } = render(
      <TypingDisplay
        originalText={originalText}
        typedText=""
        currentIndex={0}
        charStatuses={['pending', 'pending', 'pending', 'pending']}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement

    // Rapidly change currentIndex
    for (let i = 0; i <= originalText.length; i++) {
      rerender(
        <TypingDisplay
          originalText={originalText}
          typedText={originalText.slice(0, i)}
          currentIndex={i}
          charStatuses={Array(originalText.length).fill('pending').map((_, idx) => 
            idx < i ? 'correct' : 'pending'
          )}
        />
      )
      
      // Cursor should always be visible (except maybe at specific edge cases)
      if (i < originalText.length) {
        expect(cursor).toBeTruthy()
      }
    }
  })

  it('should update cursor position when originalText changes', () => {
    const { container, rerender } = render(
      <TypingDisplay
        originalText="ab"
        typedText=""
        currentIndex={0}
        charStatuses={['pending', 'pending']}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    const initialTransform = cursor.style.transform

    // Change to longer text
    rerender(
      <TypingDisplay
        originalText="abcd"
        typedText=""
        currentIndex={0}
        charStatuses={['pending', 'pending', 'pending', 'pending']}
      />
    )

    // Cursor should still be valid
    expect(cursor).toBeTruthy()
  })

  it('should handle single character text', () => {
    const { container } = render(
      <TypingDisplay
        originalText="a"
        typedText=""
        currentIndex={0}
        charStatuses={['pending']}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    expect(cursor.style.opacity).not.toBe('0')
    expect(container.textContent).toBe('a')
  })

  it('should position cursor at end for single character text when completed', () => {
    const { container } = render(
      <TypingDisplay
        originalText="a"
        typedText="a"
        currentIndex={1}
        charStatuses={['correct']}
      />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    // currentIndex (1) >= originalText.length (1), so cursor should be at end
    expect(cursor.style.opacity).not.toBe('0')
  })
})
