import { Routes, Route } from 'react-router-dom'

// shared layout
import { AppLayout } from './components/AppLayout'

// pages
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/LoginPage.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import BaliwagExtractor from './utils/ExcelParsers/BaliwagExtractor.jsx'
import ManageUsers from './pages/ManageUsers/ManageUsers.jsx'


function App() {
  return (
    <Routes>
      {/* Public routes — no sidebar/header */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />

      {/* Authenticated routes — wrapped with AppLayout */}
      <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/manage-user" element={<AppLayout><ManageUsers /></AppLayout>} />
    </Routes>
  )
}

export default App


