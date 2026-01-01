import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../Navbar'
import { AuthProvider } from '../../context/AuthContext'

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
  })

  it('should render navbar with links', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Donkey Type')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Leaderboard')).toBeInTheDocument()
  })

  it('should show Login link when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('should show user info and Logout button when authenticated', () => {
    mockUser = { id: 1, username: 'testuser', email: 'test@example.com', bestWpm: 0, averageAccuracy: 0, totalTests: 0 }
    mockIsAuthenticated = true

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )

    // The text "Welcome, testuser" is split across elements
    // Check for the username in a span with font-semibold
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText(/Welcome,/)).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })

  it('should call logout and navigate on logout click', async () => {
    const user = userEvent.setup()
    mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    mockIsAuthenticated = true

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )

    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
