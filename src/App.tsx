import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import { useAuthContext } from './contexts/AuthContext'
import { PetProvider } from './contexts/PetContext'
import { CursorProvider } from './contexts/CursorContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { tutorialService } from './services/tutorialService'
import ProtectedRoute from './components/ProtectedRoute'
import Tutorial from './components/Tutorial'
import { NotificationWrapper } from './components/NotificationWrapper'
import AchievementPopup from './components/AchievementPopup'
import { useAchievementNotifications } from './hooks/useAchievementNotifications'
import Accounts from './pages/Accounts/Accounts'
import Mastery from './pages/Mastery/Mastery'
import Ranked from './pages/Ranked/Ranked'
import Champions from './pages/Champions/Champions'
import Skins from './pages/Skins/Skins'
import Achievements from './pages/Achievements/Achievements'
import Redeem from './pages/Redeem/Redeem'
import Adoption from './pages/Adoption/Adoption'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import CursorSelection from './pages/CursorSelection/CursorSelection'
import Roulette from './pages/Roulette/Roulette'
import Feed from './pages/Feed/Feed'
import Profile from './pages/Profile/Profile'

function AppContent() {
  const { isAuthenticated, user } = useAuthContext();
  const location = useLocation();
  const { currentAchievement, closeAchievement } = useAchievementNotifications();

  // Check if user has a pet
  const hasPet = () => {
    const pet = tutorialService.getSelectedPet();
    return pet && pet.petName; // Must have both pet and pet name
  };

  // Hide navigation on adoption and cursor-selection pages
  const showNav = isAuthenticated && location.pathname !== '/adoption' && location.pathname !== '/cursor-selection';

  // Get pet data for achievement popup
  const getPetData = () => {
    const pet = tutorialService.getSelectedPet();
    return {
      petType: pet?.petType || '1',
      petStage: pet?.petStage || 1
    };
  };

  const petData = getPetData();

  return (
    <LanguageProvider>
      <CursorProvider>
        <PetProvider>
          <NotificationWrapper>
            {showNav && <Nav />}
            <Tutorial />

            {/* Global Achievement Popup - shows when new achievements are detected */}
            {currentAchievement && (
              <AchievementPopup
                isOpen={true}
                onClose={closeAchievement}
                title={currentAchievement.notification.title}
                description={currentAchievement.notification.description}
                category={currentAchievement.category}
                elo={currentAchievement.elo}
                progress={currentAchievement.progress}
                total={currentAchievement.total}
                tier={currentAchievement.tier}
                petType={petData.petType}
                petStage={petData.petStage}
                userName={user?.username || 'beast'}
              />
            )}

            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to={hasPet() ? "/accounts" : "/cursor-selection"} replace /> : <Login />
                }
              />
              <Route
                path="/signup"
                element={
                  isAuthenticated ? <Navigate to={hasPet() ? "/accounts" : "/cursor-selection"} replace /> : <SignUp />
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
                    <Mastery />
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
                path="/champions"
                element={
                  <ProtectedRoute>
                    <Champions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skins"
                element={
                  <ProtectedRoute>
                    <Skins />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <Achievements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roulette"
                element={
                  <ProtectedRoute>
                    <Roulette />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/redeem"
                element={
                  <ProtectedRoute>
                    <Redeem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adoption"
                element={
                  <ProtectedRoute>
                    <Adoption />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*"
                element={
                  <Navigate to={isAuthenticated ? (hasPet() ? "/accounts" : "/cursor-selection") : "/login"} replace />
                }
              />
            </Routes>
          </NotificationWrapper>
        </PetProvider>
      </CursorProvider>
    </LanguageProvider>
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
