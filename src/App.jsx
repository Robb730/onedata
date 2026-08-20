import { Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { lazy, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./lib/supabaseClient.js";
import { useUser } from "./contexts/UserContext.jsx";
import { useIdleTimeout } from "./hooks/useIdleTimeout";

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
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const { setUserProfile, userProfile } = useUser();

  // Use a ref so idle callbacks always see the latest session (avoids stale closure)
  const sessionRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      sessionRef.current = session;
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      sessionRef.current = session;
      if (!session) {
        setUserProfile(null);
        localStorage.removeItem("userProfile");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Stable callbacks — read sessionRef.current to avoid stale closure
  const handleWarning = useCallback(() => {
    if (sessionRef.current) setShowIdleWarning(true);
  }, []);

  const handleIdle = useCallback(async () => {
    if (sessionRef.current) {
      setShowIdleWarning(false);
      await supabase.auth.signOut();
      setUserProfile(null);
      localStorage.removeItem("userProfile");
      window.location.href = "/login";
    }
  }, [setUserProfile]);

  useIdleTimeout(handleWarning, 25 * 60 * 1000); // warn after 25 minutes
  useIdleTimeout(handleIdle, 30 * 60 * 1000);    // logout after 30 minutes

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
      {showIdleWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              Session about to expire
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              You've been inactive for a while. You'll be logged out automatically
              in a few seconds unless you stay active.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowIdleWarning(false)}
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                className="px-5 py-2.5 text-sm font-bold text-white rounded-full shadow-sm hover:opacity-90 transition-opacity"
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
