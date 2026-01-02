import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Register from '../Register'
import { AuthProvider } from '../../context/AuthContext'

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
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

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRegister.mockClear()
    mockNavigate.mockClear()
  })

  it('should render register form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('choose a username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('min 6 characters')).toBeInTheDocument()
  })

  it('should handle registration submission', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({})

    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/practice')
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
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument()
    })
  })

  it('should show loading state during registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should have link to login page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginLink = screen.getByText('login here')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should handle error without response data', async () => {
    const user = userEvent.setup()
    mockRegister.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByPlaceholderText('choose a username')
    const emailInput = screen.getByPlaceholderText('enter your email')
    const passwordInput = screen.getByPlaceholderText('min 6 characters')
    const submitButton = screen.getByRole('button', { name: 'create account' })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
    })
  })
})
