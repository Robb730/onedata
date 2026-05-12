import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

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
  userName = "Juan Dela Cruz",
  userRole = "Administrator",
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#eef2f7" }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <TopHeader
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
