import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import TypingDisplay, { TypingDisplayHandle } from '../TypingDisplay'
import React from 'react'

describe('TypingDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
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

    it('should render words as separate elements', () => {
      const { container } = render(
        <TypingDisplay originalText="hello world test" />
      )
      
      const words = container.querySelectorAll('.word')
      expect(words.length).toBe(3)
    })

    it('should render characters with pending class initially', () => {
      const { container } = render(
        <TypingDisplay originalText="test" />
      )
      
      const chars = container.querySelectorAll('.char')
      expect(chars.length).toBe(4)
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should render cursor element', () => {
      const { container } = render(
        <TypingDisplay originalText="test" />
      )

      const cursor = container.querySelector('.typing-cursor')
      expect(cursor).toBeTruthy()
    })

    it('should have cursor-smooth class for smooth transitions', () => {
      const { container } = render(
        <TypingDisplay originalText="test" />
      )

      const cursor = container.querySelector('.cursor-smooth')
      expect(cursor).toBeTruthy()
    })
  })

  describe('Word-based Typing', () => {
    it('should mark character as correct when matching', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      const firstChar = container.querySelector('.char')
      expect(firstChar?.classList.contains('correct')).toBe(true)
    })

    it('should mark character as incorrect when not matching', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      const firstChar = container.querySelector('.char')
      expect(firstChar?.classList.contains('incorrect')).toBe(true)
    })

    it('should create overflow characters when typing beyond word length', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type 'ab'
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      // Type extra 'x' - should become overflow
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      const overflowChars = container.querySelectorAll('.char.overflow')
      expect(overflowChars.length).toBe(1)
      expect(overflowChars[0].textContent).toBe('x')
    })

    it('should move to next word on space', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type 'ab'
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      // Type space
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Now typing 'c' should affect the second word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      
      // getCurrentIndex should reflect position in second word
      expect(ref.current?.getCurrentIndex()).toBeGreaterThan(2)
    })

    it('should mark skipped characters as incorrect when space is typed early', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test word" />
      )
      
      // Type only 't' then space (skipping 'est')
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // The skipped characters 'est' should be marked incorrect
      const words = container.querySelectorAll('.word')
      const firstWordChars = words[0].querySelectorAll('.char:not(.overflow)')
      
      expect(firstWordChars[0].classList.contains('correct')).toBe(true) // 't'
      expect(firstWordChars[1].classList.contains('incorrect')).toBe(true) // 'e' skipped
      expect(firstWordChars[2].classList.contains('incorrect')).toBe(true) // 's' skipped
      expect(firstWordChars[3].classList.contains('incorrect')).toBe(true) // 't' skipped
    })

    it('should NOT allow space to skip word if no character was typed', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test word" />
      )
      
      // Try to press space without typing anything
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Should still be at first word, first char
      expect(ref.current?.getCurrentIndex()).toBe(0)
      
      // All chars should still be pending
      const chars = container.querySelectorAll('.char')
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should allow space only after typing at least one character', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Space without typing - should be ignored
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      expect(ref.current?.getCurrentIndex()).toBe(0)
      
      // Type one character
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      expect(ref.current?.getCurrentIndex()).toBe(1)
      
      // Now space should work
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      expect(ref.current?.getCurrentIndex()).toBe(3) // After first word + space
    })
  })

  describe('Backspace', () => {
    it('should handle backspace within word', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Second char should be pending again
      const chars = container.querySelectorAll('.char')
      expect(chars[1].classList.contains('pending')).toBe(true)
    })

    it('should remove overflow characters on backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type 'ab' + overflow 'x'
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(1)
      
      // Backspace should remove overflow
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(0)
    })

    it('should move to previous word on backspace at word start', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type first word + space
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Now at start of second word, backspace should go to first word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Typing should now affect first word
      const index = ref.current?.getCurrentIndex()
      expect(index).toBe(2) // At end of first word
    })

    it('should not allow backspace at start of first word', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
    })
  })

  describe('Callbacks', () => {
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
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      expect(onStart).toHaveBeenCalled()
    })

    it('should call onComplete when test finishes', () => {
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
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' })) // Finalize last word
      
      expect(onComplete).toHaveBeenCalled()
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
  })

  describe('Error and Correct Tracking', () => {
    it('should track error count correctly', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      
      expect(ref.current?.getErrorCount()).toBe(2)
    })

    it('should track correct count correctly', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' })) // correct
      
      expect(ref.current?.getCorrectCount()).toBe(3)
    })

    it('should include overflow characters in error count', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // overflow
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'y' })) // overflow
      
      expect(ref.current?.getErrorCount()).toBe(2)
      expect(ref.current?.getCorrectCount()).toBe(2)
    })
  })

  describe('Reset', () => {
    it('should reset all state correctly', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type some characters
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      
      // Reset
      ref.current?.reset()
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
      expect(ref.current?.getErrorCount()).toBe(0)
      expect(ref.current?.isComplete()).toBe(false)
      
      // All chars should be pending
      const chars = container.querySelectorAll('.char:not(.overflow)')
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should clear overflow characters on reset', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Create overflow
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(1)
      
      ref.current?.reset()
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(0)
    })

    it('should restore cursor blink on reset', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Start typing (removes blink)
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      let cursor = container.querySelector('.cursor-smooth')
      expect(cursor?.classList.contains('typing-cursor')).toBe(false)
      
      // Reset
      ref.current?.reset()
      
      cursor = container.querySelector('.cursor-smooth')
      expect(cursor?.classList.contains('typing-cursor')).toBe(true)
    })
  })

  describe('Special Keys', () => {
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
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' })) // complete
      
      expect(ref.current?.isComplete()).toBe(true)
      
      // Try to type more
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      
      // Should not advance
      expect(ref.current?.getCurrentIndex()).toBe(2)
    })
  })

  describe('Focus', () => {
    it('should expose focus method', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Should not throw
      expect(() => ref.current?.focus()).not.toThrow()
    })
  })
})
