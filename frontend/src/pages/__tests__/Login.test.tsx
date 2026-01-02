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

    expect(screen.getByRole('heading', { name: 'login' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('enter your password')).toBeInTheDocument()
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

    const createAccountLink = screen.getByText('create one')
    await user.click(createAccountLink)

    expect(screen.getByRole('heading', { name: 'create account' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('choose a username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('enter your email')).toBeInTheDocument()
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

    const usernameInput = screen.getByPlaceholderText('enter your username')
    const passwordInput = screen.getByPlaceholderText('enter your password')
    const submitButton = screen.getByRole('button', { name: 'login' })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
    })

    await waitFor(() => {
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

    const usernameInput = screen.getByPlaceholderText('enter your username')
    const passwordInput = screen.getByPlaceholderText('enter your password')
    const submitButton = screen.getByRole('button', { name: 'login' })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('enter your username')
    const passwordInput = screen.getByPlaceholderText('enter your password')
    const submitButton = screen.getByRole('button', { name: 'login' })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('logging in...')).toBeInTheDocument()
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

    // Switch to register mode
    const createAccountLink = screen.getByText('create one')
    await user.click(createAccountLink)

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser',
        'new@example.com',
        'password123'
      )
    })
  })

  it('should display error message on registration failure', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue({
      response: { data: { message: 'Username already exists' } },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register mode
    const createAccountLink = screen.getByText('create one')
    await user.click(createAccountLink)

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'existinguser')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument()
    })
  })

  it('should show loading state during registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register mode
    const createAccountLink = screen.getByText('create one')
    await user.click(createAccountLink)

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('creating...')).toBeInTheDocument()
  })

  it('should display fallback error message on login failure without response data', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('enter your username')
    const passwordInput = screen.getByPlaceholderText('enter your password')
    const submitButton = screen.getByRole('button', { name: 'login' })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Login failed. Please check your credentials.')
      ).toBeInTheDocument()
    })
  })

  it('should switch from register to login and clear error', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue({
      response: { data: { message: 'Registration error' } },
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to register mode
    await user.click(screen.getByText('create one'))

    // Trigger an error
    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration error')).toBeInTheDocument()
    })

    // Switch back to login
    await user.click(screen.getByText('login here'))

    // Error should be cleared
    expect(screen.queryByText('Registration error')).not.toBeInTheDocument()
  })
})
