import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeProvider, useTheme, Theme } from '../ThemeContext'

// Helper component to test useTheme hook
const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classList
    document.documentElement.classList.remove('light', 'dark')
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should provide default dark theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme from dark to light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')

    act(() => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should toggle theme from light to dark', () => {
    localStorage.setItem('donkey-type-theme', 'light')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')

    act(() => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('should set theme directly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByText('Set Light'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(localStorage.getItem('donkey-type-theme')).toBe('light')

    act(() => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(localStorage.getItem('donkey-type-theme')).toBe('dark')
  })

  it('should load theme from localStorage', () => {
    localStorage.setItem('donkey-type-theme', 'light')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('should persist theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(localStorage.getItem('donkey-type-theme')).toBe('light')
  })

  it('should respect system preference for light mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })

  it('should update document classList when theme changes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)

    act(() => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should handle invalid localStorage value and default to dark', () => {
    localStorage.setItem('donkey-type-theme', 'invalid-theme')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Should fall back to checking system preference, then default to dark
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})

