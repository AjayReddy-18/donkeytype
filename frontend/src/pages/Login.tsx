import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="min-h-[calc(100vh-3.5rem)] bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text mb-6 text-center">
          {isRegistering ? 'create account' : 'login'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-accent-error/10 border border-accent-error/30 rounded text-accent-error text-sm">
            {error}
          </div>
        )}

        {isRegistering ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-text-secondary mb-1">
                username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                className="w-full px-3 py-2 bg-bg-secondary border border-border text-text rounded focus:border-primary"
                placeholder="choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-text-secondary mb-1">
                email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-secondary border border-border text-text rounded focus:border-primary"
                placeholder="enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
                password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-bg-secondary border border-border text-text rounded focus:border-primary"
                placeholder="min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-bg font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'creating...' : 'create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-text-secondary mb-1">
                username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-secondary border border-border text-text rounded focus:border-primary"
                placeholder="enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
                password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-secondary border border-border text-text rounded focus:border-primary"
                placeholder="enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary text-bg font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'logging in...' : 'login'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          {isRegistering ? (
            <>
              already have an account?{' '}
              <button
                onClick={() => {
                  setIsRegistering(false)
                  setError('')
                }}
                className="text-primary font-semibold"
              >
                login here
              </button>
            </>
          ) : (
            <>
              don't have an account?{' '}
              <button
                onClick={() => {
                  setIsRegistering(true)
                  setError('')
                }}
                className="text-primary font-semibold"
              >
                create one
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default Login
