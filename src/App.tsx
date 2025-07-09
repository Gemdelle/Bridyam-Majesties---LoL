import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import { useAuthContext } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Accounts from './pages/Accounts/Accounts'
import Bloodlines from './pages/Bloodlines/Bloodlines'
import Ranked from './pages/Ranked/Ranked'
import Champions from './pages/Champions/Champions'
import Achievements from './pages/Achievements/Achievements'
import Login from './pages/Login/Login'

function App() {
  const { isAuthenticated, isInitialized } = useAuthContext();

  // Show loading while auth state is being determined
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#c89b3c',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        {isAuthenticated && <Nav />}
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodlines"
            element={
              <ProtectedRoute>
                <Bloodlines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranked"
            element={
              <ProtectedRoute>
                <Ranked />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to home or login */}
          <Route
            path="/champions" element={<Champions />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*"
            element={
              <Navigate to={isAuthenticated ? "/" : "/login"} replace />
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
