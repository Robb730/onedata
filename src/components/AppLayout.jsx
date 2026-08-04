// eslint-disable-next-line no-unused-vars
import React, { use, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import {supabase} from '../lib/supabaseClient';
import {useNavigate} from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { ChangePasswordModal } from "./Modals/ChangePasswordModal";

/**
 * AppLayout — Shared layout wrapper providing the sidebar + top header
 * shell around authenticated page content.
 *
 * Usage:
 *   <AppLayout>
 *     <DashboardPage />
 *   </AppLayout>
 *
 * @param {React.ReactNode} children — page content
 * @param {string}  [userName]
 * @param {string}  [userRole]
 */
export function AppLayout({
  children,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { userProfile, setUserProfile } = useUser();

  const mustChange = userProfile?.must_change_password === true;

  function handlePasswordChange() {
    const updated = {...userProfile, must_change_password: false };
    setUserProfile(updated);
    localStorage.setItem("userProfile", JSON.stringify(updated));
  }

  function handleLogout() {
    supabase.auth.signOut();
    localStorage.removeItem("userProfile");
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f4f9" }}>

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
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <TopHeader
          userName={userProfile?.full_name || "User"}
          userRole={userProfile?.role || "Role"}
          onMenuToggle={() => setSidebarCollapsed((v) => !v)}
          onLogout={handleLogout}
        />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
