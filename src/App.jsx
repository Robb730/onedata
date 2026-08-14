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
import AuditLogs from './pages/AuditLogs/AuditLogs.jsx'
import Repository from './pages/Repository/Repository.jsx'
import RepositoryFolderDetailPage from './pages/Repository/RepositoryFolderDetailPage.jsx'
import RepositoryDivisionPage from './pages/Repository/RepositoryDivisionPage.jsx'
import AccessRestrictedPage from './pages/Repository/AccessRestrictedPage.jsx'
import SchoolYearPage from './pages/SchoolYear/SchoolYearPage.jsx'
import SettingsPage from './pages/Settings/SettingsPage.jsx'
import ChangePasswordPage from './pages/Settings/ChangePasswordPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserProfile, userProfile } = useUser();

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
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/test" element={<BaliwagExtractor />} />
      <Route path="/dashboard" element={
        <ProtectedRoute session={session}>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/manage-user" element={
        <ProtectedRoute session={session}>
          <AppLayout><ManageUsers /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/upload-files" element={
        <ProtectedRoute session={session}>
          <AppLayout><UploadFilesPage role={userProfile?.role} userSection={userProfile?.section_name} /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/audit-logs" element={
        <ProtectedRoute session={session}>
          <AppLayout><AuditLogs /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/repository" element={
        <ProtectedRoute session={session}>
          <AppLayout><Repository /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/repository/folder/:folderName" element={
        <ProtectedRoute session={session}>
          <AppLayout><RepositoryFolderDetailPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/repository/divisions/:divisionSlug" element={
        <ProtectedRoute session={session}>
          <AppLayout><RepositoryDivisionPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/repository/sections/sgod" element={
        <ProtectedRoute session={session}>
          <AppLayout><RepositoryDivisionPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/repository/restricted/:folderName" element={
        <ProtectedRoute session={session}>
          <AppLayout><AccessRestrictedPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/school-year" element={
        <ProtectedRoute session={session}>
          <AppLayout><SchoolYearPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute session={session}>
          <AppLayout><SettingsPage /></AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App