import { useState, useEffect } from "react";
import {
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  UserX,
  UserCheck,
  ChevronDown,
  FolderOpen,
  Shield,
  Briefcase,
} from "lucide-react";
import EditUserModal from "../../components/ManageUsersComponents/EditUserModal";
import DeleteConfirmationModal from "../../components/ManageUsersComponents/DeleteConfirmationModal";
import UserLogsModal from "../../components/ManageUsersComponents/UserLogsModal";
import AddNewUserModal from "../../components/ManageUsersComponents/AddNewUserModal";
import SuccessModal from "../../components/ManageUsersComponents/SuccessModal";
import DeactivateConfirmationModal from "../../components/ManageUsersComponents/DeactivateConfirmationModal";
import ActivateConfirmationModal from "../../components/ManageUsersComponents/ActivateConfirmationModal";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../contexts/UserContext";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [viewingLogsUser, setViewingLogsUser] = useState(null);
  const [addingNewUser, setAddingNewUser] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [activatingUser, setActivatingUser] = useState(null);
  const { userProfile, refreshProfile } = useUser();
  const [showToast, setShowToast] = useState(false);

  // ─── Fetch users from Supabase ───────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        id_number,
        email,
        role,
        is_active,
        created_at,
        divisions ( id, name ),
        sections  ( id, name, division_id, divisions ( id, name ) )
      `,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error.message);
      setLoading(false);
      return;
    }

    // Normalize into flat shape for the UI
    const normalized = data.map((u) => {
      // Prefer the user's own division; fall back to the division
      // linked through their section (for section-scoped roles).
      const resolvedDivision = u.divisions ?? u.sections?.divisions ?? null;

      return {
        id: u.id,
        name: u.full_name,
        idNumber: u.id_number,
        email: u.email,
        role: u.role,
        division: resolvedDivision?.name ?? "—",
        divisionId: resolvedDivision?.id ?? null,
        section: u.sections?.name ?? "—",
        sectionId: u.sections?.id ?? null,
        status: u.is_active ? "Active" : "Inactive",
        avatar: u.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase(),
      };
    });

    setUsers(normalized);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // ─── Divisions list for filter dropdown ──────────────────────
  const divisions = [
    "All",
    ...Array.from(new Set(users.map((u) => u.division))).filter(
      (d) => d !== "—",
    ),
  ];

  // ─── Filter ──────────────────────────────────────────────────
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.division.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision =
      selectedDivision === "All" || user.division === selectedDivision;
    return matchesSearch && matchesDivision;
  });

  // ─── Group by division (Categories Sections) ─────────────────
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const key = user.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  // ─── Handlers ────────────────────────────────────────────────
  const handleEditUser = async (userId, updates) => {
    const { error } = await supabase
      .from("users")
      .update({
        role: updates.role,
        division_id: updates.divisionId,
        section_id: updates.sectionId,
      })
      .eq("id", userId);

    if (error) {
      alert("Error updating user: " + error.message);
      return;
    }

    if (userId === userProfile?.id) {
    await refreshProfile();
  }
    fetchUsers(); // refresh from DB
  };

  const logAuditEvent = async ({ action, fileName, details, role, status = "Success" }) => {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      file_name: fileName,
      details,
      performed_by: userProfile?.full_name ?? "System",
      role: getRoleDisplay(role) ?? "Unknown",
      status,
    });
    if (error) console.error("Audit log insert failed:", error.message);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    const res = await fetch("http://localhost:3001/api/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deletingUser.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Error deleting user: " + data.error);
      await logAuditEvent({
        action: "Other",
        fileName: deletingUser.name,
        details: `Failed to delete user account (${deletingUser.email}): ${data.error}`,
        role: deletingUser.role,
        status: "Failed",
      });
      return;
    }

    await logAuditEvent({
      action: "Other",
      fileName: deletingUser.name,
      details: `Deleted user account (${deletingUser.email})`,
      role: deletingUser.role,
      status: "Success",
    });

    setDeletingUser(null);
    setShowToast(true);
    fetchUsers();
  };

  const handleAddNewUser = async (newUserData) => {
    const res = await fetch("http://localhost:3001/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newUserData.email,
        full_name: newUserData.name,
        division_id: newUserData.divisionId,
        section_id: newUserData.sectionId,
        role: getRoleDisplay(newUserData.role),
        idNumber: newUserData.idNumber,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.error);
      return;
    }

    await logAuditEvent({
      action: "Other",
      fileName: newUserData.name,
      details: `Created new user account (${newUserData.email})`,
      role: newUserData.role,
      status: "Success",
    });

    setAddingNewUser(false);
    setSuccessEmail(newUserData.email);
    fetchUsers();
  };

  const handleDeactivateUser = async () => {
    if (!deactivatingUser) return;

    const { error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", deactivatingUser.id);

    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setDeactivatingUser(null);
    fetchUsers();
  };

  const handleActivateUser = async () => {
    if (!activatingUser) return;

    const { error } = await supabase
      .from("users")
      .update({ is_active: true })
      .eq("id", activatingUser.id);

    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setActivatingUser(null);
    fetchUsers();
  };

  // ─── Badge helpers ───────────────────────────────────────────
  const getRoleBadgeColor = (role) => {
    const display = getRoleDisplay(role);
    if (display.includes("Focal Person"))
      return "bg-blue-50 text-blue-600 border border-blue-100";
    if (display.includes("Officer"))
      return "bg-purple-50 text-purple-600 border border-purple-100";
    if (display.includes("Administrator"))
      return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-slate-100 text-slate-600 border border-slate-200/80";
  };

  const roleDisplayMap = {
    division_focal: "Division Focal Person",
    section_focal: "Section Officer",
    section_personnel: "Section Personnel",
    administrator: "Administrator",
  };

  const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

  // Stats calculation
  const totalUsers = users.length;
  const focalPersonsCount = users.filter(
    (u) => u.role?.includes("Focal Person") || u.role === "division_focal"
  ).length;
  const sectionOfficersCount = users.filter(
    (u) => u.role?.includes("Officer") || u.role === "section_focal"
  ).length;
  const personnelCount = users.filter(
    (u) => u.role?.includes("Personnel") || u.role === "section_personnel"
  ).length;

  const statCardsData = [
    {
      label: "TOTAL USERS",
      value: totalUsers,
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      icon: <UsersIcon size={18} className="text-white" />,
    },
    {
      label: "FOCAL PERSONS",
      value: focalPersonsCount,
      gradient: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
      icon: <UserCheck size={18} className="text-white" />,
    },
    {
      label: "SECTION OFFICERS",
      value: sectionOfficersCount,
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      icon: <Shield size={18} className="text-white" />,
    },
    {
      label: "PERSONNEL",
      value: personnelCount,
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      icon: <Briefcase size={18} className="text-white" />,
    },
  ];

  // ─── UI ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
          <p className="text-[0.78rem] font-semibold text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 py-8">
      {showToast && (
        <div
          className="fixed top-6 right-6 z-50 flex bg-white overflow-hidden animate-toast-in"
          style={{
            width: "360px",
            height: "72px",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {/* Green accent bar */}
          <div style={{ width: "6px", backgroundColor: "#43D45B", flexShrink: 0 }} />

          {/* Content */}
          <div
            className="flex items-center flex-1 relative"
            style={{ padding: "0 14px", gap: "12px" }}
          >
            {/* Icon circle */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#43D45B",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center">
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#1F1F2E", lineHeight: 1.2, margin: 0 }}>
                Success
              </p>
              <p style={{ fontSize: "12.5px", fontWeight: 500, color: "#666666", marginTop: "2px", margin: 0 }}>
                User deleted successfully.
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowToast(false)}
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
              Manage Users
            </h1>
            <p className="text-[0.78rem] text-slate-400 font-medium mt-1">
              Manage user accounts and access permissions
            </p>
          </div>

          <button
            id="manage-users-add-btn"
            onClick={() => setAddingNewUser(true)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-blue-500 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer shrink-0"
          >
            <UserPlus size={15} />
            Add New User
          </button>
        </div>

        {/* ── Summary / Stat Cards Row ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCardsData.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-[16px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px]"
              style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
            >
              {/* Top row: Circle Icon (Left) + Large Metric Value (Right) */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                  style={{ background: stat.gradient }}
                >
                  {stat.icon}
                </div>
                <p className="text-[1.75rem] font-black text-slate-800 tracking-tight leading-none">
                  {stat.value}
                </p>
              </div>
              {/* Bottom row: Label */}
              <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.08em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search & Filter Controls ─────────────────────── */}
        <div
          className="rounded-[14px] border border-slate-100/80 bg-white p-3.5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}
        >
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="user-search-input"
              type="text"
              placeholder="Search by name, ID, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2 text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <span className="text-[0.78rem] font-semibold text-slate-500">
              Division:
            </span>
            <div className="relative flex items-center">
              <select
                id="user-division-filter"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="rounded-[10px] border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2 text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
              >
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ── Users Grouped by Division (Categories Sections) ── */}
        {filteredUsers.length > 0 ? (
          <div className="space-y-9">
            {Object.entries(groupedUsers).map(([division, divisionUsers]) => (
              <div key={division}>
                {/* Division Category Header */}
                <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-slate-200/60">
                  <h2 className="text-[1.1rem] font-bold text-slate-800 tracking-[-0.01em]">
                    {division}
                  </h2>
                  <span className="text-[0.75rem] font-semibold text-slate-400">
                    {divisionUsers.length} {divisionUsers.length === 1 ? "user" : "users"}
                  </span>
                </div>

                {/* User Cards Grid for this Division */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {divisionUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setViewingLogsUser(user)}
                      className="group relative flex flex-col justify-between rounded-[16px] border border-slate-100/80 bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] cursor-pointer"
                      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
                    >
                      <div>
                        {/* Status badge */}
                        <div className="flex items-center justify-end mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full ${
                              user.status === "Active"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200/80"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.status === "Active"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {user.status}
                          </span>
                        </div>

                        {/* Avatar & User Details */}
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-[1.1rem] shadow-sm mb-2.5 transition-transform duration-300 group-hover:scale-105">
                            {user.avatar}
                          </div>
                          <h3 className="font-bold text-slate-800 text-center text-[0.92rem] tracking-tight leading-tight truncate max-w-full">
                            {user.name}
                          </h3>
                          <p className="text-[0.72rem] font-medium text-slate-400 text-center mt-1">
                            ID: {user.idNumber ?? "—"}
                          </p>
                        </div>

                        {/* Division & Section Details Box */}
                        <div className="rounded-[12px] bg-slate-50/80 border border-slate-100 p-3.5 mb-4 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <FolderOpen size={13} className="text-blue-500 shrink-0" />
                            <p className="text-[0.78rem] font-bold text-slate-800 leading-snug truncate">
                              {user.division}
                            </p>
                          </div>
                          {user.role !== "division_focal" && user.section && user.section !== "—" && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="h-1 w-1 rounded-full bg-blue-400" />
                              <span className="inline-block text-[0.68rem] font-semibold text-blue-600 bg-white px-2.5 py-0.5 rounded-full border border-blue-200/80">
                                {user.section}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 flex items-center justify-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold ${getRoleBadgeColor(
                                user.role,
                              )}`}
                            >
                              {getRoleDisplay(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUser(user);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-[10px] border border-slate-200/80 bg-white py-2 text-[0.75rem] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {user.status === "Inactive" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivatingUser(user);
                              }}
                              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-emerald-200/80 bg-emerald-50/80 py-2 text-[0.75rem] font-semibold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              <UserCheck size={12} /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeactivatingUser(user);
                              }}
                              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-amber-200/80 bg-amber-50/80 py-2 text-[0.75rem] font-semibold text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
                            >
                              <UserX size={12} /> Deactivate
                            </button>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingUser(user);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-[10px] border border-rose-200/80 bg-rose-50/70 py-2 text-[0.75rem] font-semibold text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div
            className="rounded-[16px] border border-slate-100/80 bg-white p-12 text-center"
            style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
          >
            <UsersIcon className="mx-auto text-slate-300 opacity-60 mb-3" size={36} strokeWidth={1.5} />
            <h3 className="text-[0.95rem] font-bold text-slate-700 mb-1">
              No users found
            </h3>
            <p className="text-[0.78rem] font-medium text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* ── Modals ────────────────────────────────────────── */}
        {editingUser && (
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            user={editingUser}
            onSave={handleEditUser}
          />
        )}
        {deletingUser && (
          <DeleteConfirmationModal
            isOpen={!!deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={handleDeleteUser}
            userName={deletingUser.name}
          />
        )}
        {viewingLogsUser && (
          <UserLogsModal
            isOpen={!!viewingLogsUser}
            onClose={() => setViewingLogsUser(null)}
            user={viewingLogsUser}
          />
        )}
        {addingNewUser && (
          <AddNewUserModal
            isOpen={addingNewUser}
            onClose={() => setAddingNewUser(false)}
            onAdd={handleAddNewUser}
          />
        )}
        {successEmail && (
          <SuccessModal
            isOpen={!!successEmail}
            onClose={() => setSuccessEmail("")}
            title="User Created Successfully!"
            message="The user account has been created and login credentials have been sent."
            email={successEmail}
          />
        )}
        {deactivatingUser && (
          <DeactivateConfirmationModal
            isOpen={!!deactivatingUser}
            onClose={() => setDeactivatingUser(null)}
            onConfirm={handleDeactivateUser}
            userName={deactivatingUser.name}
          />
        )}
        {activatingUser && (
          <ActivateConfirmationModal
            isOpen={!!activatingUser}
            onClose={() => setActivatingUser(null)}
            onConfirm={handleActivateUser}
            userName={activatingUser.name}
          />
        )}
      </div>
      </div>
    </div>
  );
}