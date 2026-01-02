import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../Navbar'
import { AuthProvider } from '../../context/AuthContext'
import { ThemeProvider } from '../../context/ThemeContext'

// Mock useAuth
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

let mockUser: any = null
let mockIsAuthenticated = false

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: mockIsAuthenticated,
    }),
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockLogout.mockClear()
    mockUser = null
    mockIsAuthenticated = false
    localStorage.clear()
  })

  const renderNavbar = () => {
    return render(
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Navbar />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    )
  }

  it('should render navbar with links', () => {
    renderNavbar()

    expect(screen.getByText('donkey type')).toBeInTheDocument()
    expect(screen.getByText('home')).toBeInTheDocument()
    expect(screen.getByText('practice')).toBeInTheDocument()
    expect(screen.getByText('leaderboard')).toBeInTheDocument()
  })

  it('should show Login link when not authenticated', () => {
    renderNavbar()

    expect(screen.getByText('login')).toBeInTheDocument()
    expect(screen.queryByText('logout')).not.toBeInTheDocument()
  })

  it('should show user info and logout button when authenticated', () => {
    mockUser = { id: 1, username: 'testuser', email: 'test@example.com', bestWpm: 0, averageAccuracy: 0, totalTests: 0 }
    mockIsAuthenticated = true

    renderNavbar()

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('logout')).toBeInTheDocument()
    expect(screen.queryByText('login')).not.toBeInTheDocument()
  })

  it('should call logout and navigate on logout click', async () => {
    const user = userEvent.setup()
    mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    mockIsAuthenticated = true

    renderNavbar()

    const logoutButton = screen.getByText('logout')
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should render theme toggle button', () => {
    renderNavbar()

    const themeButton = screen.getByRole('button', { name: /switch to light mode/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup()
    renderNavbar()

    // Initially dark mode
    let themeButton = screen.getByRole('button', { name: /switch to light mode/i })
    expect(themeButton).toBeInTheDocument()

    // Toggle to light
    await user.click(themeButton)

    // Now should show dark mode option
    themeButton = screen.getByRole('button', { name: /switch to dark mode/i })
    expect(themeButton).toBeInTheDocument()
  })
})
