import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.scss'
import { Nav } from './components/Nav/Nav'
import Accounts from './pages/Accounts/Accounts'
import Bloodlines from './pages/Bloodlines/Bloodlines'

function App() {

  return (
    <>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Accounts />} />
          <Route path="/bloodlines" element={<Bloodlines />} />
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
