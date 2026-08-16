import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient.js";
import { useUser } from "./contexts/UserContext.jsx";

import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleProtectedRoute from "./components/RoleProtectedRoute.jsx";
import NotFoundPage from './pages/NotFound/NotFoundPage.jsx'

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard.jsx"));
const ManageUsers = lazy(() => import("./pages/ManageUsers/ManageUsers.jsx"));
const UploadFilesPage = lazy(() => import("./pages/UploadFiles/UploadFilesPage.jsx"));
const AuditLogs = lazy(() => import("./pages/AuditLogs/AuditLogs.jsx"));
const Repository = lazy(() => import("./pages/Repository/Repository.jsx"));
const RepositoryFolderDetailPage = lazy(() => import("./pages/Repository/RepositoryFolderDetailPage.jsx"));
const RepositoryDivisionPage = lazy(() => import("./pages/Repository/RepositoryDivisionPage.jsx"));
const AccessRestrictedPage = lazy(() => import("./pages/Repository/AccessRestrictedPage.jsx"));
const SchoolYearPage = lazy(() => import("./pages/SchoolYear/SchoolYearPage.jsx"));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage.jsx"));
const ChangePasswordPage = lazy(() => import("./pages/Settings/ChangePasswordPage.jsx"));
const BaliwagExtractor = lazy(() => import("./utils/ExcelParsers/BaliwagExtractor.jsx"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
      Loading…
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserProfile, userProfile } = useUser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      
      <Route path="/test" element={<BaliwagExtractor />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-user"
        element={
          <RoleProtectedRoute session={session} roles={["administrator"]}>
            <AppLayout>
              <ManageUsers />
            </AppLayout>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/upload-files"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <UploadFilesPage
                role={userProfile?.role}
                userSection={userProfile?.section_name}
              />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <RoleProtectedRoute session={session} roles={["administrator"]}>
            <AppLayout>
              <AuditLogs />
            </AppLayout>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/repository"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <Repository />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repository/folder/:folderName"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <RepositoryFolderDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repository/divisions/:divisionSlug"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <RepositoryDivisionPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repository/sections/sgod"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <RepositoryDivisionPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repository/restricted/:folderName"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <AccessRestrictedPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
  path="/school-year"
  element={
    <RoleProtectedRoute session={session} roles={["administrator"]}>
      <AppLayout>
        <SchoolYearPage />
      </AppLayout>
    </RoleProtectedRoute>
  }
/>
      <Route
        path="/settings"
        element={
          <ProtectedRoute session={session}>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default App;
