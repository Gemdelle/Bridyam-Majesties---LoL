import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import Accounts from './pages/Accounts/Accounts'
import Bloodlines from './pages/Bloodlines/Bloodlines'
import Ranked from './pages/Ranked/Ranked'
import Champions from './pages/Champions/Champions'
import Achievements from './pages/Achievements/Achievements'
import Login from './pages/Login/Login'

function App() {

  return (
    <>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Accounts />} />
          <Route path="/bloodlines" element={<Bloodlines />} />
          <Route path="/ranked" element={<Ranked />} />
          <Route path="/champions" element={<Champions />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/login" element={<Login />} />
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
