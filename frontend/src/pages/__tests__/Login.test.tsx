import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'
import { AuthProvider } from '../../context/AuthContext'

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      register: mockRegister,
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

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockClear()
    mockRegister.mockClear()
    mockNavigate.mockClear()
  })

  it('should render login form by default', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('should switch to register form', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const createAccountLink = screen.getByText('Create one')
    await user.click(createAccountLink)

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Choose a username (3-20 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
  })

  it('should handle login submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({})

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^Login$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/practice')
    })
  })

  it('should handle registration submission', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({})

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register
    await user.click(screen.getByText('Create one'))

    const usernameInput = screen.getByPlaceholderText('Choose a username (3-20 characters)')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Choose a password (min 6 characters)')
    const submitButton = screen.getByRole('button', { name: /^Create Account$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/practice')
    })
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^Login$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should clear error when switching between login and register', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Trigger error
    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^Login$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    // Switch to register - error should clear
    await user.click(screen.getByText('Create one'))
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
  })

  it('should handle error without response data', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /^Login$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument()
    })
  })

  it('should clear error when switching from register to login', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue({
      response: { data: { message: 'Registration failed' } },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register
    await user.click(screen.getByText('Create one'))

    // Trigger error
    const usernameInput = screen.getByPlaceholderText('Choose a username (3-20 characters)')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Choose a password (min 6 characters)')
    const submitButton = screen.getByRole('button', { name: /^Create Account$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument()
    })

    // Switch back to login - error should clear
    await user.click(screen.getByText('Login here'))
    expect(screen.queryByText('Registration failed')).not.toBeInTheDocument()
  })

  it('should handle registration error without response data', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register
    await user.click(screen.getByText('Create one'))

    const usernameInput = screen.getByPlaceholderText('Choose a username (3-20 characters)')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Choose a password (min 6 characters)')
    const submitButton = screen.getByRole('button', { name: /^Create Account$/ })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
    })
  })
})
