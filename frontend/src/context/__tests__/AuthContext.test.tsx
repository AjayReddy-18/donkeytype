import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserResponse } from '../../types/api'

// Mock the API BEFORE importing AuthContext
const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('../../services/api', () => ({
  login: (...args: any[]) => mockLogin(...args),
  register: (...args: any[]) => mockRegister(...args),
}))

// Now import AuthContext after mocking
import { AuthProvider, useAuth } from '../AuthContext'

const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => register('testuser', 'test@example.com', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockClear()
    mockRegister.mockClear()
    // Clear localStorage
    localStorage.clear()
  })

  it('should provide initial state with no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('username')).toHaveTextContent('none')
  })

  it('should login successfully', async () => {
    const user = userEvent.setup()
    const mockUser: UserResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      bestWpm: 100,
      averageAccuracy: 95.5,
      totalTests: 10,
    }

    mockLogin.mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password')
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })
  })

  it('should register successfully', async () => {
    const user = userEvent.setup()
    const mockUser: UserResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      bestWpm: 0,
      averageAccuracy: 0,
      totalTests: 0,
    }

    mockRegister.mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const registerButton = screen.getByText('Register')
    await user.click(registerButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password')
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })
  })

  it('should logout successfully', async () => {
    const user = userEvent.setup()
    const mockUser: UserResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      bestWpm: 100,
      averageAccuracy: 95.5,
      totalTests: 10,
    }

    mockLogin.mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Login first
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    // Then logout
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('username')).toHaveTextContent('none')
    })
  })

  it('should load user from localStorage on mount', () => {
    const mockUser: UserResponse = {
      id: 1,
      username: 'saveduser',
      email: 'saved@example.com',
      bestWpm: 100,
      averageAccuracy: 95.5,
      totalTests: 10,
    }

    localStorage.setItem('user', JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('username')).toHaveTextContent('saveduser')
  })

  it('should handle invalid localStorage data', () => {
    localStorage.setItem('user', 'invalid json')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // This will throw an error because useAuth is called outside AuthProvider
    const TestComponentOutside = () => {
      useAuth()
      return <div>Test</div>
    }
    
    expect(() => {
      render(<TestComponentOutside />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})
