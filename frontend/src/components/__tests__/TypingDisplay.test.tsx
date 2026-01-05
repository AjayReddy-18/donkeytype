import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TypingDisplay, { TypingDisplayHandle } from '../TypingDisplay'
import React from 'react'

describe('TypingDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render text correctly', () => {
    const { container } = render(
      <TypingDisplay originalText="hello world" />
    )
    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('world')
  })

  it('should handle empty text', () => {
    const { container } = render(
      <TypingDisplay originalText="" />
    )
    expect(container.querySelector('.typing-text')).toBeTruthy()
  })

  it('should render all characters as spans with pending class', () => {
    const { container } = render(
      <TypingDisplay originalText="test" />
    )
    
    const chars = container.querySelectorAll('.char')
    expect(chars.length).toBe(4)
    chars.forEach((char) => {
      expect(char.classList.contains('pending')).toBe(true)
    })
  })

  it('should handle words with spaces', () => {
    const { container } = render(
      <TypingDisplay originalText="hello world" />
    )
    
    // "hello world" = 11 characters (5 + 1 space + 5)
    const chars = container.querySelectorAll('.char')
    expect(chars.length).toBe(11)
  })

  it('should render cursor element', () => {
    const { container } = render(
      <TypingDisplay originalText="test" />
    )

    const cursor = container.querySelector('.typing-cursor')
    expect(cursor).toBeTruthy()
  })

  it('should have cursor with proper styling', () => {
    const { container } = render(
      <TypingDisplay originalText="test" />
    )

    const cursor = container.querySelector('.typing-cursor') as HTMLElement
    expect(cursor).toBeTruthy()
    expect(cursor.style.position).toBe('absolute')
    expect(cursor.style.width).toBe('3px')
  })

  it('should have cursor-smooth class for smooth transitions', () => {
    const { container } = render(
      <TypingDisplay originalText="test" />
    )

    const cursor = container.querySelector('.cursor-smooth')
    expect(cursor).toBeTruthy()
  })

  it('should call onStart when typing begins', () => {
    const onStart = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="test" 
        onStart={onStart}
      />
    )
    
    // Simulate typing first character
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    
    expect(onStart).toHaveBeenCalled()
  })

  it('should mark character as correct when matching', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type 't'
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    
    const firstChar = container.querySelector('.char[data-index="0"]')
    expect(firstChar?.classList.contains('correct')).toBe(true)
  })

  it('should mark character as incorrect when not matching', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type wrong character
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
    
    const firstChar = container.querySelector('.char[data-index="0"]')
    expect(firstChar?.classList.contains('incorrect')).toBe(true)
  })

  it('should handle backspace correctly', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type 't'
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    expect(ref.current?.getCurrentIndex()).toBe(1)
    
    // Backspace
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
    expect(ref.current?.getCurrentIndex()).toBe(0)
    
    const firstChar = container.querySelector('.char[data-index="0"]')
    expect(firstChar?.classList.contains('pending')).toBe(true)
  })

  it('should call onComplete when text is finished', () => {
    const onComplete = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="ab" 
        onComplete={onComplete}
      />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
    
    expect(onComplete).toHaveBeenCalledWith({
      errorCount: 0,
      correctCount: 2,
    })
  })

  it('should track error count correctly', () => {
    const onComplete = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="ab" 
        onComplete={onComplete}
      />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' })) // correct
    
    expect(onComplete).toHaveBeenCalledWith({
      errorCount: 1,
      correctCount: 1,
    })
  })

  it('should call onType on each keystroke', () => {
    const onType = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="test" 
        onType={onType}
      />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
    
    expect(onType).toHaveBeenCalledTimes(2)
  })

  it('should reset correctly', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type some characters
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
    
    expect(ref.current?.getCurrentIndex()).toBe(2)
    
    // Reset
    ref.current?.reset()
    
    expect(ref.current?.getCurrentIndex()).toBe(0)
    expect(ref.current?.getErrorCount()).toBe(0)
    expect(ref.current?.isComplete()).toBe(false)
    
    // Check all chars are pending again
    const chars = container.querySelectorAll('.char')
    chars.forEach((char) => {
      expect(char.classList.contains('pending')).toBe(true)
    })
  })

  it('should ignore modifier key combinations', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't', ctrlKey: true }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't', metaKey: true }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't', altKey: true }))
    
    expect(ref.current?.getCurrentIndex()).toBe(0)
  })

  it('should ignore special keys', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Shift' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }))
    
    expect(ref.current?.getCurrentIndex()).toBe(0)
  })

  it('should not allow typing after completion', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay ref={ref} originalText="ab" />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
    
    expect(ref.current?.isComplete()).toBe(true)
    
    // Try to type more
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
    
    expect(ref.current?.getCurrentIndex()).toBe(2) // Should not advance
  })

  it('should not allow backspace at index 0', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
    
    expect(ref.current?.getCurrentIndex()).toBe(0)
  })

  it('should remove typing-cursor class when typing starts', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Before typing - cursor should blink
    expect(container.querySelector('.typing-cursor')).toBeTruthy()
    
    // Start typing
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    
    // Cursor should not blink anymore (no typing-cursor class)
    const cursor = container.querySelector('.cursor-smooth')
    expect(cursor).toBeTruthy()
    expect(cursor?.classList.contains('typing-cursor')).toBe(false)
  })

  it('should re-add typing-cursor class on reset', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    
    // Reset
    ref.current?.reset()
    
    // Cursor should blink again
    expect(container.querySelector('.typing-cursor')).toBeTruthy()
  })

  it('should expose focus method', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    const focusableElement = container.querySelector('[tabindex]')
    expect(focusableElement).toBeTruthy()
    
    // Should not throw
    ref.current?.focus()
  })

  it('should handle space character correctly', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="a b" />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
    
    expect(ref.current?.isComplete()).toBe(true)
    expect(ref.current?.getErrorCount()).toBe(0)
  })

  it('should call cursor update logic on each keystroke', () => {
    const ref = React.createRef<TypingDisplayHandle>()
    const { container } = render(
      <TypingDisplay ref={ref} originalText="test" />
    )
    
    // Type a character
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    
    // Cursor should exist and have transform style
    const cursor = container.querySelector('.cursor-smooth') as HTMLElement
    expect(cursor).toBeTruthy()
    expect(cursor.style.transform).toBeDefined()
    
    // getCurrentIndex should have advanced
    expect(ref.current?.getCurrentIndex()).toBe(1)
  })

  it('should handle rapid typing without errors', () => {
    const onComplete = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="test" 
        onComplete={onComplete}
      />
    )
    
    // Rapid fire all keys
    'test'.split('').forEach((char) => {
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
    })
    
    expect(onComplete).toHaveBeenCalledWith({
      errorCount: 0,
      correctCount: 4,
    })
  })

  it('should handle backspace during typing', () => {
    const onType = vi.fn()
    const ref = React.createRef<TypingDisplayHandle>()
    
    render(
      <TypingDisplay 
        ref={ref}
        originalText="test" 
        onType={onType}
      />
    )
    
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
    ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
    
    // onType should be called for backspace too
    expect(onType).toHaveBeenCalledTimes(2)
  })

  it('should pre-render characters with data-index attribute', () => {
    const { container } = render(
      <TypingDisplay originalText="abc" />
    )
    
    expect(container.querySelector('.char[data-index="0"]')?.textContent).toBe('a')
    expect(container.querySelector('.char[data-index="1"]')?.textContent).toBe('b')
    expect(container.querySelector('.char[data-index="2"]')?.textContent).toBe('c')
  })
})
