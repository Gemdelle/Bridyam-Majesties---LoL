import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import Accounts from './pages/Accounts/Accounts'
import Bloodlines from './pages/Bloodlines/Bloodlines'
import Ranked from './pages/Ranked/Ranked'

function App() {

  return (
    <>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Accounts />} />
          <Route path="/bloodlines" element={<Bloodlines />} />
          <Route path="/ranked" element={<Ranked />} />
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
