import { Routes, Route } from 'react-router-dom'

// shared layout
import { AppLayout } from './components/AppLayout'

import {useEffect, useState} from "react";
import {supabase} from './lib/supabaseClient.js';

// pages
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/LoginPage.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import BaliwagExtractor from './utils/ExcelParsers/BaliwagExtractor.jsx'
import ManageUsers from './pages/ManageUsers/ManageUsers.jsx'
import UploadFilesPage from './pages/UploadFiles/UploadFilesPage.jsx'


function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);  // ✅ this auto-updates when login succeeds
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <Routes>
      {/* Public routes — no sidebar/header */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />

      {/* Authenticated routes — wrapped with AppLayout */}
      <Route path="/dashboard" element={ session ? <AppLayout><Dashboard /></AppLayout> : <LoginPage /> } />
      <Route path="/manage-user" element={ session ? <AppLayout><ManageUsers /></AppLayout> : <LoginPage /> } />
      <Route path="/upload-files" element={ session ? <AppLayout><UploadFilesPage /></AppLayout> : <LoginPage /> } />
    </Routes>
  )
}

export default App


