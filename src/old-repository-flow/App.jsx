import { Routes, Route } from "react-router-dom"
import LandingPage from "./Pages/landingPage"
import LoginPage from "./Pages/loginPage"
import AdminPage from "./Pages/adminPage"

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/repository" element={<AdminPage />} />
      </Routes>

    </div>
  )
}