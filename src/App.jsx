import { Routes, Route } from 'react-router-dom'

// pages (we'll create these one by one)


import LandingPage from './pages/LandingPage/LandingPage.jsx'
import BaliwagExtractor from './utils/ExcelParsers/BaliwagExtractor.jsx'
import ManageUsers from './pages/ManageUsers/ManageUsers.jsx'


function App() {
  return (
    <Routes>
      {/* public routes - no login needed */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />
      <Route path="/manage-user" element={<ManageUsers />} />
    </Routes>
  )
}

export default App
