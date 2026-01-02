import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-bg">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
