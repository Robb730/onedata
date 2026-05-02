import { Routes, Route } from 'react-router-dom'

// pages (we'll create these one by one)

import LandingPage from './pages/LandingPage'
import BaliwagExtractor from './pages/BaliwagExtractor'


function App() {
  return (
    <Routes>
      {/* public routes - no login needed */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />
      
    </Routes>
  )
}

export default App