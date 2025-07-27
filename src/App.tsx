import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import { useAuthContext } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Accounts from './pages/Accounts/Accounts'
import Bloodlines from './pages/Bloodlines/Bloodlines'
import Ranked from './pages/Ranked/Ranked'
import Champions from './pages/Champions/Champions'
import Achievements from './pages/Achievements/Achievements'
import Redeem from './pages/Redeem/Redeem'
import Adoption from './pages/Adoption/Adoption'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import CursorSelection from './pages/CursorSelection/CursorSelection'

function AppContent() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Hide navigation on adoption and cursor-selection pages
  const showNav = isAuthenticated && location.pathname !== '/adoption' && location.pathname !== '/cursor-selection';

  return (
    <>
      {showNav && <Nav />}
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignUp />
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
        <Route
          path="/cursor-selection"
          element={
            <ProtectedRoute>
              <CursorSelection />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to home or login */}
        <Route
          path="/champions" element={<Champions />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/adoption" element={<Adoption />} />
        <Route path="*"
          element={
            <Navigate to={isAuthenticated ? "/" : "/login"} replace />
          }
        />
      </Routes>
    </>
  )
}

function App() {
  const { isInitialized } = useAuthContext();

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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
