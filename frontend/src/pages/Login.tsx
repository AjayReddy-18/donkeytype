import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/practice')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(username, email, password)
      navigate('/practice')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-6 text-center">
            {isRegistering ? 'Create Account' : 'Login'}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-[#3d2115] border border-[#8b4513] rounded-md text-[#f85149] text-sm">
              {error}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#c9d1d9] mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                  placeholder="Choose a username (3-20 characters)"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#c9d1d9] mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#c9d1d9] mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                  placeholder="Choose a password (min 6 characters)"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-[#238636] text-white font-semibold rounded-md hover:bg-[#2ea043] disabled:bg-[#30363d] disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#c9d1d9] mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#c9d1d9] mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-[#238636] text-white font-semibold rounded-md hover:bg-[#2ea043] disabled:bg-[#30363d] disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#8b949e]">
            {isRegistering ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(false)
                    setError('')
                  }}
                  className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold"
                >
                  Login here
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegistering(true)
                    setError('')
                  }}
                  className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold"
                >
                  Create one
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
