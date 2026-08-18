// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { supabase } from "../lib/supabaseClient";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { ChangePasswordModal } from "./Modals/ChangePasswordModal";

function LayoutPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
      Loading…
    </div>
  );
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const { userProfile, setUserProfile } = useUser();

  const mustChange = userProfile?.must_change_password === true;

  useEffect(() => {
    if (!showPasswordToast) return;
    const timer = setTimeout(() => setShowPasswordToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showPasswordToast]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 280);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  function handlePasswordChange() {
    const updated = { ...userProfile, must_change_password: false };
    setUserProfile(updated);
    localStorage.setItem("userProfile", JSON.stringify(updated));
    setShowPasswordToast(true);
  }

  function handleLogout() {
    supabase.auth.signOut();
    localStorage.removeItem("userProfile");
    navigate("/login");
  }

  return (
    // Mobile: document scroll (lets browser chrome collapse like the landing page).
    // Desktop: fixed viewport + inner scroll so the sidebar stays put.
    <div
      className="app-shell flex min-h-dvh lg:h-dvh lg:overflow-hidden"
      style={{ background: "#f0f4f9" }}
    >
      <div className="app-shell-inner flex w-full min-h-dvh lg:h-full lg:min-h-0">
        <ChangePasswordModal
          isOpen={mustChange}
          onSuccess={handlePasswordChange}
        />

        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 lg:min-h-0 lg:overflow-hidden">
          {/* Top header */}
          <TopHeader
            userName={userProfile?.full_name || "User"}
            userRole={userProfile?.role || "Role"}
            onLogout={handleLogout}
          />

          <main
            className={`app-main flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:min-h-0 lg:overflow-y-auto lg:pb-0 ${isAnimating ? "animate-page-in" : ""}`}
          >
            <Suspense fallback={<LayoutPageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        {showPasswordToast && (
          <div
            className="fixed top-4 left-4 right-4 z-50 flex bg-white overflow-hidden animate-toast-in sm:left-auto sm:right-6 sm:w-[360px]"
            style={{
              height: "72px",
              borderRadius: "12px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            <div
              style={{
                width: "6px",
                backgroundColor: "#43D45B",
                flexShrink: 0,
              }}
            />

            <div
              className="flex items-center flex-1 relative"
              style={{ padding: "0 14px", gap: "12px" }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "#43D45B",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="flex flex-col justify-center">
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1F1F2E",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Success
                </p>
                <p
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color: "#666666",
                    marginTop: "2px",
                    margin: 0,
                  }}
                >
                  Password updated successfully.
                </p>
              </div>

              <button
                onClick={() => setShowPasswordToast(false)}
                className="absolute top-2 right-2.5 cursor-pointer"
                style={{
                  color: "#666666",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
