import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-[#161b22] border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-[#58a6ff] hover:text-[#79c0ff] transition-colors">
              Donkey Type
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors"
              >
                Home
              </Link>
              <Link
                to="/practice"
                className="px-3 py-2 rounded-md text-sm font-medium text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors"
              >
                Practice
              </Link>
              <Link
                to="/leaderboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-[#c9d1d9]">
                  Welcome, <span className="font-semibold text-white">{user?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#f85149] rounded-md hover:bg-[#da3633] transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#c9d1d9] hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
