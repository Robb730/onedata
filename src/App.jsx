import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { useEffect, useState } from "react";
import { supabase } from './lib/supabaseClient.js';
import { useUser } from "./contexts/UserContext.jsx";

import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/Login/LoginPage.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import BaliwagExtractor from './utils/ExcelParsers/BaliwagExtractor.jsx'
import ManageUsers from './pages/ManageUsers/ManageUsers.jsx'
import UploadFilesPage from './pages/UploadFiles/UploadFilesPage.jsx'

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserProfile } = useUser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserProfile(null);
        localStorage.removeItem("userProfile");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />
      <Route path="/dashboard" element={ session ? <AppLayout><Dashboard /></AppLayout> : <LoginPage /> } />
      <Route path="/manage-user" element={ session ? <AppLayout><ManageUsers /></AppLayout> : <LoginPage /> } />
      <Route path="/upload-files" element={ session ? <AppLayout><UploadFilesPage /></AppLayout> : <LoginPage /> } />
    </Routes>
  )
}

export default App