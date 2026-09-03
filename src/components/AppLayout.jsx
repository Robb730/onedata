// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { supabase } from "../lib/supabaseClient";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { ChangePasswordModal } from "./Modals/ChangePasswordModal";
import DataPrivacyModal from "./Modals/DataPrivacyModal";
import { CheckCircle, X } from "lucide-react";

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
  const { userProfile, setUserProfile, refreshProfile } = useUser();

  const mustChange = userProfile?.must_change_password === true;
  const needsPrivacyAccept = mustChange && userProfile?.accepted_data_privacy !== true;

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

  async function handlePasswordChange() {
    const updated = { ...userProfile, must_change_password: false };
    setUserProfile(updated);
    localStorage.setItem("userProfile", JSON.stringify(updated));
    await refreshProfile();
    setShowPasswordToast(true);
  }

  function handlePrivacyAccept() {
    const updated = { ...userProfile, accepted_data_privacy: true };
    setUserProfile(updated);
    localStorage.setItem("userProfile", JSON.stringify(updated));
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
        <DataPrivacyModal
          isOpen={needsPrivacyAccept}
          onSuccess={handlePrivacyAccept}
        />
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

        <div
          className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 flex flex-col overflow-hidden bg-white transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] lg:bottom-8 sm:left-auto sm:right-6 sm:w-[380px] ${showPasswordToast
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-[120%] opacity-0 pointer-events-none"
            }`}
          style={{
            minHeight: "76px",
            borderRadius: "16px",
            boxShadow: showPasswordToast
              ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
              : "0 12px 30px rgba(0,0,0,0)",
            fontFamily: "Poppins, sans-serif",
            border: "1px solid rgba(241, 245, 249, 1)",
          }}
        >
          <div className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none bg-gradient-to-r from-emerald-100/60 to-transparent" />

          <div
            className="flex items-center relative z-10 py-4 flex-1"
            style={{ padding: "0 20px", gap: "16px", minHeight: "76px" }}
          >
            <div
              className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
              style={{ width: "42px", height: "42px" }}
            >
              <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Success
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#64748B",
                  marginTop: "3px",
                  margin: 0,
                }}
              >
                Password updated successfully.
              </p>
            </div>
            <button
              onClick={() => setShowPasswordToast(false)}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
              aria-label="Close notification"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
