import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('donkey-type-theme')
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    // Check system preference (guarded for test/SSR environments)
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: light)').matches
    ) {
      return 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    // Apply theme class to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('donkey-type-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

