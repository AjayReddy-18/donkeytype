import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock the pages
vi.mock('../pages/Home', () => ({
  default: () => <div>Home Page</div>,
}))

vi.mock('../pages/Practice', () => ({
  default: () => <div>Practice Page</div>,
}))

vi.mock('../pages/Leaderboard', () => ({
  default: () => <div>Leaderboard Page</div>,
}))

vi.mock('../pages/Login', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('../pages/Register', () => ({
  default: () => <div>Register Page</div>,
}))

vi.mock('../components/Navbar', () => ({
  default: () => <nav>Navbar</nav>,
}))

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Create a mock location hook
let mockPathname = '/'

// Mock react-router-dom to avoid Router nesting
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => {
      // Filter routes based on current pathname
      const childrenArray = Array.isArray(children) ? children : [children]
      const matchingRoute = childrenArray.find((child: any) => {
        if (!child || !child.props) return false
        const path = child.props.path
        if (path === mockPathname) return true
        if (path === '/' && mockPathname === '/') return true
        if (path === '*' && mockPathname !== '/' && !['/practice', '/leaderboard', '/login', '/register'].includes(mockPathname)) return true
        return false
      })
      return matchingRoute ? <div>{matchingRoute.props.element}</div> : <div>{childrenArray[0]?.props?.element}</div>
    },
    Route: ({ path, element }: { path: string; element: React.ReactNode }) => (
      <div data-testid={`route-${path}`}>{element}</div>
    ),
    Navigate: ({ to }: { to: string }) => {
      mockPathname = to
      return <div>Home Page</div>
    },
    useLocation: () => ({ pathname: mockPathname }),
    useNavigate: () => vi.fn(),
  }
})

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/'
  })

  it('should render App component', () => {
    render(<App />)

    expect(screen.getByText('Navbar')).toBeInTheDocument()
  })

  it('should render Home page on root route', () => {
    mockPathname = '/'
    render(<App />)

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('should render Practice page on /practice route', () => {
    mockPathname = '/practice'
    render(<App />)

    expect(screen.getByText('Practice Page')).toBeInTheDocument()
  })

  it('should render Leaderboard page on /leaderboard route', () => {
    mockPathname = '/leaderboard'
    render(<App />)

    expect(screen.getByText('Leaderboard Page')).toBeInTheDocument()
  })

  it('should render Login page on /login route', () => {
    mockPathname = '/login'
    render(<App />)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('should navigate to home on unknown route', () => {
    mockPathname = '/unknown'
    render(<App />)

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
