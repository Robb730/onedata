import { Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { MobileBottomNav } from "./components/MobileBottomNav";
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

const APP_NAV_PREFIXES = [
  "/dashboard",
  "/repository",
  "/upload-files",
  "/manage-user",
  "/audit-logs",
  "/school-year",
  "/settings",
];

function AppMobileNav({ session }) {
  const location = useLocation();

  useEffect(() => {
    import("./pages/Dashboard/Dashboard.jsx");
  }, []);

  if (!session) return null;
  const show = APP_NAV_PREFIXES.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
  );
  return <MobileBottomNav visible={show} />;
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
    <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <Suspense fallback={<PageFallback />}>
            <ChangePasswordPage />
          </Suspense>
        }
      />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route
        path="/test"
        element={
          <Suspense fallback={<PageFallback />}>
            <BaliwagExtractor />
          </Suspense>
        }
      />

      <Route
        element={
          <ProtectedRoute session={session}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/upload-files"
          element={
            <UploadFilesPage
              role={userProfile?.role}
              userSection={userProfile?.section_name}
            />
          }
        />
        <Route path="/repository" element={<Repository />} />
        <Route
          path="/repository/folder/:folderName"
          element={<RepositoryFolderDetailPage />}
        />
        <Route
          path="/repository/divisions/:divisionSlug"
          element={<RepositoryDivisionPage />}
        />
        <Route
          path="/repository/sections/sgod"
          element={<RepositoryDivisionPage />}
        />
        <Route
          path="/repository/restricted/:folderName"
          element={<AccessRestrictedPage />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/manage-user"
          element={
            <RoleProtectedRoute session={session} roles={["administrator"]}>
              <ManageUsers />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <RoleProtectedRoute session={session} roles={["administrator"]}>
              <AuditLogs />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/school-year"
          element={
            <RoleProtectedRoute session={session} roles={["administrator"]}>
              <SchoolYearPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <AppMobileNav session={session} />
    </>
  );
}

export default App;
