import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-bg-secondary border-b border-border">
      <div className="w-full px-8 lg:px-16">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-2xl font-bold text-primary hover:text-primary-hover"
            >
              donkey type
            </Link>
            <div className="ml-10 flex space-x-2">
              <Link
                to="/"
                className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text"
              >
                home
              </Link>
              <Link
                to="/practice"
                className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text"
              >
                practice
              </Link>
              <Link
                to="/leaderboard"
                className="px-4 py-2 text-base font-medium text-text-secondary hover:text-text"
              >
                leaderboard
              </Link>
            </div>
          </div>

          {/* Right side - Theme toggle and Auth */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Auth section */}
            {isAuthenticated ? (
              <>
                <span className="text-base text-text">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 text-base font-medium text-text-secondary hover:text-accent-error"
                >
                  logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 text-base font-medium text-text-secondary hover:text-primary"
              >
                login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
