import { Routes, Route } from 'react-router-dom'

// pages (we'll create these one by one)

import LandingPage from './pages/LandingPage'


function App() {
  return (
    <Routes>
      {/* public routes - no login needed */}
      <Route path="/" element={<LandingPage />} />
      
    </Routes>
  )
}

export default App