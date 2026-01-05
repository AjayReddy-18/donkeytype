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
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
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
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      
      expect(ref.current?.getCurrentIndex()).toBeGreaterThan(2)
    })

    it('should mark skipped characters as incorrect when space is typed early', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test word" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      const words = container.querySelectorAll('.word')
      const firstWordChars = words[0].querySelectorAll('.char:not(.overflow)')
      
      expect(firstWordChars[0].classList.contains('correct')).toBe(true)
      expect(firstWordChars[1].classList.contains('incorrect')).toBe(true)
      expect(firstWordChars[2].classList.contains('incorrect')).toBe(true)
      expect(firstWordChars[3].classList.contains('incorrect')).toBe(true)
    })

    it('should NOT allow space to skip word if no character was typed', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test word" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
      
      const chars = container.querySelectorAll('.char')
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })
  })

  describe('Permanent Keystroke Tracking (Accuracy Bug Fix)', () => {
    it('should NOT decrease error count when backspacing incorrect character', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type wrong character
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
      expect(ref.current?.getTotalKeystrokes()).toBe(1)
      
      // Backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Error count should NOT decrease!
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
      expect(ref.current?.getTotalKeystrokes()).toBe(1)
    })

    it('should NOT decrease correct count when backspacing correct character', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type correct character
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      expect(ref.current?.getCorrectKeystrokes()).toBe(1)
      expect(ref.current?.getTotalKeystrokes()).toBe(1)
      
      // Backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Correct count should NOT decrease!
      expect(ref.current?.getCorrectKeystrokes()).toBe(1)
      expect(ref.current?.getTotalKeystrokes()).toBe(1)
    })

    it('should result in <100% accuracy when mistake is corrected', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      // Type wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      // Backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      // Type correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      // Stats: totalKeystrokes=3, correctKeystrokes=2, incorrectKeystrokes=1
      expect(ref.current?.getTotalKeystrokes()).toBe(3)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
      
      // Accuracy should be 2/3 = 66.67%, NOT 100%
      const accuracy = (ref.current!.getCorrectKeystrokes() / ref.current!.getTotalKeystrokes()) * 100
      expect(accuracy).toBeCloseTo(66.67, 1)
    })

    it('should count multiple corrected mistakes', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      // Make 3 mistakes on first char, correct each time
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'y' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'z' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      // Finally type correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      // 3 wrong + 2 correct = 5 total, 2 correct, 3 incorrect
      expect(ref.current?.getTotalKeystrokes()).toBe(5)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(3)
      
      // Accuracy = 2/5 = 40%
      const accuracy = (ref.current!.getCorrectKeystrokes() / ref.current!.getTotalKeystrokes()) * 100
      expect(accuracy).toBe(40)
    })

    it('should NOT decrease overflow error count on backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type 'ab' + overflow 'x'
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // overflow
      
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
      
      // Backspace removes overflow visually
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // But error count stays!
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
    })

    it('should give 100% accuracy when all characters are correct', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      expect(ref.current?.getTotalKeystrokes()).toBe(2)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(0)
      
      const accuracy = (ref.current!.getCorrectKeystrokes() / ref.current!.getTotalKeystrokes()) * 100
      expect(accuracy).toBe(100)
    })

    it('should give 0% accuracy when all characters are wrong', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'y' }))
      
      expect(ref.current?.getTotalKeystrokes()).toBe(2)
      expect(ref.current?.getCorrectKeystrokes()).toBe(0)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(2)
      
      const accuracy = (ref.current!.getCorrectKeystrokes() / ref.current!.getTotalKeystrokes()) * 100
      expect(accuracy).toBe(0)
    })

    it('should still update visual state on backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      // First char should be incorrect visually
      let firstChar = container.querySelector('.char')
      expect(firstChar?.classList.contains('incorrect')).toBe(true)
      
      // Backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // First char should be pending visually again
      firstChar = container.querySelector('.char')
      expect(firstChar?.classList.contains('pending')).toBe(true)
      
      // But error count stays
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
    })

    it('should count skipped characters as errors permanently', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test word" />
      )
      
      // Type 't' then space (skipping 'est')
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // 1 correct ('t') + 3 skipped ('est') = 4 keystrokes, 1 correct, 3 errors
      expect(ref.current?.getTotalKeystrokes()).toBe(4)
      expect(ref.current?.getCorrectKeystrokes()).toBe(1)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(3)
    })
  })

  describe('Test Completion', () => {
    it('should complete test immediately when last character of last word is typed', () => {
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
      
      expect(ref.current?.isComplete()).toBe(true)
      expect(onComplete).toHaveBeenCalled()
    })

    it('should include permanent stats in onComplete', () => {
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
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' })) // correct, completes
      
      expect(onComplete).toHaveBeenCalledWith({
        totalKeystrokes: 3,
        correctKeystrokes: 2,
        incorrectKeystrokes: 1,
      })
    })

    it('should prevent typing after completion', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      expect(ref.current?.isComplete()).toBe(true)
      
      const totalBefore = ref.current?.getTotalKeystrokes()
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'd' }))
      
      expect(ref.current?.getTotalKeystrokes()).toBe(totalBefore)
    })

    it('should call onComplete only once', () => {
      const onComplete = vi.fn()
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay 
          ref={ref}
          originalText="a" 
          onComplete={onComplete}
        />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      
      expect(onComplete).toHaveBeenCalledTimes(1)
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
      
      const chars = container.querySelectorAll('.char')
      expect(chars[1].classList.contains('pending')).toBe(true)
    })

    it('should remove overflow characters visually on backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(1)
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(0)
    })

    it('should move to previous word on backspace at word start', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      expect(ref.current?.getCurrentIndex()).toBe(2)
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

  describe('Reset', () => {
    it('should reset all permanent stats correctly', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      
      ref.current?.reset()
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
      expect(ref.current?.getTotalKeystrokes()).toBe(0)
      expect(ref.current?.getCorrectKeystrokes()).toBe(0)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(0)
      expect(ref.current?.isComplete()).toBe(false)
      
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
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      let cursor = container.querySelector('.cursor-smooth')
      expect(cursor?.classList.contains('typing-cursor')).toBe(false)
      
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
      expect(ref.current?.getTotalKeystrokes()).toBe(0)
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
      expect(ref.current?.getTotalKeystrokes()).toBe(0)
    })
  })

  describe('Focus', () => {
    it('should expose focus method', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      expect(() => ref.current?.focus()).not.toThrow()
    })
  })
})
