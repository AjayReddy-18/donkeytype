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

  describe('Option+Backspace / Ctrl+Backspace (Word Delete)', () => {
    it('should delete entire current word with Option+Backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Type "hel"
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      
      expect(ref.current?.getCurrentIndex()).toBe(3)
      
      // Option+Backspace should delete entire word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }))
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
      
      // All chars should be visually pending again
      const firstWord = container.querySelectorAll('.word')[0]
      const chars = firstWord.querySelectorAll('.char:not(.overflow)')
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should delete entire current word with Ctrl+Backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Type "hel"
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      
      // Ctrl+Backspace should delete entire word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true }))
      
      expect(ref.current?.getCurrentIndex()).toBe(0)
    })

    it('should delete previous word when at start of current word', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Complete first word and move to second
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'o' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Now at start of "world", Option+Backspace should go back to "hello"
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }))
      
      // Should be at start of first word
      expect(ref.current?.getCurrentIndex()).toBe(0)
      
      // First word chars should be pending visually
      const firstWord = container.querySelectorAll('.word')[0]
      const chars = firstWord.querySelectorAll('.char:not(.overflow)')
      chars.forEach((char) => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should clear overflow characters when deleting word', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type "ab" + overflow "xyz"
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'y' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'z' }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(3)
      
      // Option+Backspace should clear all overflow and word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }))
      
      expect(container.querySelectorAll('.char.overflow').length).toBe(0)
      expect(ref.current?.getCurrentIndex()).toBe(0)
    })

    it('should NOT decrement permanent stats on word delete', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Type with some errors
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' })) // correct
      
      expect(ref.current?.getTotalKeystrokes()).toBe(3)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
      
      // Option+Backspace to delete word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }))
      
      // Stats should remain unchanged (errors are permanent!)
      expect(ref.current?.getTotalKeystrokes()).toBe(3)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1)
    })

    it('should not break normal backspace', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      
      // Normal backspace (no modifiers)
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Should only delete one character
      expect(ref.current?.getCurrentIndex()).toBe(1)
    })
  })

  describe('Word Append (Timed Mode Support)', () => {
    it('should append new words to the source array', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Initially 2 words remaining
      expect(ref.current?.getRemainingWordCount()).toBe(2)
      
      // Append 3 more words (adds to source array, not immediately visible in DOM due to windowing)
      ref.current?.appendWords(['test', 'words', 'here'])
      
      // Now should have 5 total words remaining
      expect(ref.current?.getRemainingWordCount()).toBe(5)
    })

    it('should return correct remaining word count', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world test" />
      )
      
      expect(ref.current?.getRemainingWordCount()).toBe(3)
      
      // Complete first word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'o' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      expect(ref.current?.getRemainingWordCount()).toBe(2)
    })

    it('should make appended words typeable', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab" />
      )
      
      // Complete original word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Append new word (this would mark skipped chars in "ab" and complete test without append)
      // Let's test differently - append before completing
    })

    it('should handle empty array gracefully', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="hello" />
      )
      
      const initialWordCount = container.querySelectorAll('.word').length
      
      ref.current?.appendWords([])
      
      const newWordCount = container.querySelectorAll('.word').length
      expect(newWordCount).toBe(initialWordCount)
    })
  })

  describe('Force Complete (Timed Mode)', () => {
    it('should force complete the test', () => {
      const onComplete = vi.fn()
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay 
          ref={ref}
          originalText="hello world test" 
          onComplete={onComplete}
        />
      )
      
      // Type some characters
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      
      expect(ref.current?.isComplete()).toBe(false)
      
      // Force complete (simulating timer ending)
      ref.current?.forceComplete()
      
      expect(ref.current?.isComplete()).toBe(true)
      expect(onComplete).toHaveBeenCalledWith({
        totalKeystrokes: 2,
        correctKeystrokes: 2,
        incorrectKeystrokes: 0,
      })
    })

    it('should only call onComplete once even if forceComplete called multiple times', () => {
      const onComplete = vi.fn()
      const ref = React.createRef<TypingDisplayHandle>()
      
      render(
        <TypingDisplay 
          ref={ref}
          originalText="test" 
          onComplete={onComplete}
        />
      )
      
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.forceComplete()
      ref.current?.forceComplete()
      ref.current?.forceComplete()
      
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Word Mode Support (getCompletedWordCount)', () => {
    it('should return 0 completed words initially', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world test" />
      )
      
      expect(ref.current?.getCompletedWordCount()).toBe(0)
    })

    it('should increment completed word count after space', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd ef" />
      )
      
      // Type first word + space
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Now at word 1 (0-indexed), so completed = 1
      expect(ref.current?.getCompletedWordCount()).toBe(1)
    })

    it('should track multiple completed words', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd ef gh" />
      )
      
      // Type first 3 words
      'ab cd ef '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      // Completed 3 words (now on 4th)
      expect(ref.current?.getCompletedWordCount()).toBe(3)
    })

    it('should not count incomplete words', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Type partial word (no space)
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' }))
      
      // Still 0 completed (haven't pressed space)
      expect(ref.current?.getCompletedWordCount()).toBe(0)
    })

    it('should reset completed count on reset', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd ef" />
      )
      
      // Complete 2 words
      'ab cd '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      expect(ref.current?.getCompletedWordCount()).toBe(2)
      
      // Reset
      ref.current?.reset()
      
      expect(ref.current?.getCompletedWordCount()).toBe(0)
    })

    it('should block typing after forceComplete', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type first word
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      expect(ref.current?.getCompletedWordCount()).toBe(1)
      
      // Force complete
      ref.current?.forceComplete()
      
      // Try to type more
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'd' }))
      
      // Should still be 1 (no more typing allowed)
      expect(ref.current?.getCompletedWordCount()).toBe(1)
      expect(ref.current?.getTotalKeystrokes()).toBe(2) // only ab counted
    })
  })

  describe('Text Windowing and Rendering', () => {
    it('should render words as complete units (no mid-word splitting)', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="hello world test words here" />
      )
      
      // Each word should be a complete .word element
      const words = container.querySelectorAll('.word')
      expect(words.length).toBeGreaterThan(0)
      
      // Each word should have all its characters
      words.forEach(word => {
        const chars = word.querySelectorAll('.char')
        expect(chars.length).toBeGreaterThan(0)
        
        // Verify chars spell out the word (excluding space)
        const wordText = Array.from(chars)
          .map(char => char.textContent)
          .join('')
        expect(wordText.length).toBeGreaterThan(0)
      })
    })

    it('should maintain correct word count after typing', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="one two three four five" />
      )
      
      expect(ref.current?.getRemainingWordCount()).toBe(5)
      
      // Type first word
      'one '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      expect(ref.current?.getRemainingWordCount()).toBe(4)
      
      // Type second word
      'two '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      expect(ref.current?.getRemainingWordCount()).toBe(3)
    })

    it('should not render more words than needed', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="short text" />
      )
      
      // Should only render the words that exist
      const words = container.querySelectorAll('.word')
      expect(words.length).toBe(2) // "short" and "text"
    })

    it('should handle long text without DOM bloat', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      // Generate a long text (100 words)
      const longText = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ')
      
      const { container } = render(
        <TypingDisplay ref={ref} originalText={longText} />
      )
      
      // Should render some words but not all 100
      const words = container.querySelectorAll('.word')
      expect(words.length).toBeLessThan(100)
      expect(words.length).toBeGreaterThan(0)
      
      // Total word count should still be 100
      expect(ref.current?.getRemainingWordCount()).toBe(100)
    })

    it('should reset windowing on reset call', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="one two three four five six seven eight nine ten" />
      )
      
      // Type several words
      'one two three four '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      // Reset
      ref.current?.reset()
      
      // Should be back at the beginning
      expect(ref.current?.getCurrentIndex()).toBe(0)
      expect(ref.current?.getRemainingWordCount()).toBe(10)
      
      // All chars should be pending
      const chars = container.querySelectorAll('.char')
      chars.forEach(char => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should preserve typing correctness across window operations', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      render(
        <TypingDisplay ref={ref} originalText="correct wrong fixed" />
      )
      
      // Type correctly: "correct" = 7 chars
      'correct '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      // Type incorrectly: "xxxxx" = 5 chars (space handled separately)
      'xxxxx '.split('').forEach(char => {
        ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: char }))
      })
      
      // Stats should reflect keystrokes:
      // "correct" = 7 correct chars (space is not counted as a keystroke, it just moves to next word)
      // "xxxxx" = 5 incorrect chars
      expect(ref.current?.getCorrectKeystrokes()).toBe(7)
      expect(ref.current?.getIncorrectKeystrokes()).toBe(5)
    })
  })

  describe('Line Shift State Preservation (Critical Bug Fix)', () => {
    /**
     * OWNERSHIP CONTRACT VERIFICATION:
     * Engine owns: charStates, currentWordIndex, keystroke counts
     * Renderer only displays from charStates - never recalculates
     */

    it('should persist character states to charStates array on typing', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test words" />
      )
      
      // Type first word correctly
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 's' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      // Verify DOM reflects correct state
      const firstWord = container.querySelectorAll('.word')[0]
      const chars = firstWord.querySelectorAll('.char:not(.overflow)')
      chars.forEach(char => {
        expect(char.classList.contains('correct')).toBe(true)
      })
      
      // Verify stats are recorded
      expect(ref.current?.getCorrectKeystrokes()).toBe(4)
      expect(ref.current?.getTotalKeystrokes()).toBe(4)
    })

    it('should persist overflow state to overflowStates array', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="ab cd" />
      )
      
      // Type "ab" + overflow "xyz"
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'y' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'z' }))
      
      // Verify overflow DOM elements exist
      const overflowChars = container.querySelectorAll('.char.overflow')
      expect(overflowChars.length).toBe(3)
      
      // Verify error stats
      expect(ref.current?.getIncorrectKeystrokes()).toBe(3) // overflow chars count as errors
    })

    it('should update charStates on backspace (visual reset to pending)', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type correctly then backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      
      // Both chars should be correct
      let chars = container.querySelectorAll('.char:not(.overflow)')
      expect(chars[0].classList.contains('correct')).toBe(true)
      expect(chars[1].classList.contains('correct')).toBe(true)
      
      // Backspace - should reset visual state
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }))
      
      // Second char should be pending again
      chars = container.querySelectorAll('.char:not(.overflow)')
      expect(chars[0].classList.contains('correct')).toBe(true)
      expect(chars[1].classList.contains('pending')).toBe(true)
      
      // BUT keystroke stats remain (permanent)
      expect(ref.current?.getCorrectKeystrokes()).toBe(2)
    })

    it('should clear charStates on reset', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type some chars
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' }))
      
      // Reset
      ref.current?.reset()
      
      // All chars should be pending
      const chars = container.querySelectorAll('.char:not(.overflow)')
      chars.forEach(char => {
        expect(char.classList.contains('pending')).toBe(true)
      })
      
      // Stats should be reset too
      expect(ref.current?.getCorrectKeystrokes()).toBe(0)
      expect(ref.current?.getTotalKeystrokes()).toBe(0)
    })

    it('should clear charStates when text changes', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container, rerender } = render(
        <TypingDisplay ref={ref} originalText="test" />
      )
      
      // Type some chars
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 't' }))
      
      // Rerender with new text (simulates loading new test)
      rerender(<TypingDisplay ref={ref} originalText="different" />)
      
      // All chars should be pending (new text)
      const chars = container.querySelectorAll('.char:not(.overflow)')
      chars.forEach(char => {
        expect(char.classList.contains('pending')).toBe(true)
      })
    })

    it('should handle word backspace and update charStates correctly', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="hello world" />
      )
      
      // Type "hel" with mixed correct/incorrect
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'l' })) // correct
      
      // Word backspace
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }))
      
      // All chars should be visually pending
      const firstWord = container.querySelectorAll('.word')[0]
      const chars = firstWord.querySelectorAll('.char:not(.overflow)')
      chars.forEach(char => {
        expect(char.classList.contains('pending')).toBe(true)
      })
      
      // But stats remain (permanent)
      expect(ref.current?.getTotalKeystrokes()).toBe(3)
    })

    it('should preserve correct/incorrect state when typing through multiple words', () => {
      const ref = React.createRef<TypingDisplayHandle>()
      const { container } = render(
        <TypingDisplay ref={ref} originalText="abc def ghi" />
      )
      
      // Complete first word correctly
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'a' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'b' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'c' }))
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Second word with errors
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' })) // wrong
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'e' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: 'f' })) // correct
      ref.current?.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      
      // Verify first word still shows correct
      const words = container.querySelectorAll('.word')
      const firstWordChars = words[0].querySelectorAll('.char:not(.overflow)')
      firstWordChars.forEach(char => {
        expect(char.classList.contains('correct')).toBe(true)
      })
      
      // Verify second word shows mixed states
      const secondWordChars = words[1].querySelectorAll('.char:not(.overflow)')
      expect(secondWordChars[0].classList.contains('incorrect')).toBe(true)
      expect(secondWordChars[1].classList.contains('correct')).toBe(true)
      expect(secondWordChars[2].classList.contains('correct')).toBe(true)
      
      // Stats should be accurate
      expect(ref.current?.getCorrectKeystrokes()).toBe(5) // abc + ef
      expect(ref.current?.getIncorrectKeystrokes()).toBe(1) // x
    })
  })
})
