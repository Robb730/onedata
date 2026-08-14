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
  Mail,
  Building2,
  Hash,
  User,
  X,
  CheckCircle,
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
  const [toastMessage, setToastMessage] = useState("");

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
        division: u.role === "administrator" ? "Administrator" : (resolvedDivision?.name ?? "—"),
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
    const previousRoleLabel = getRoleDisplay(editingUser?.role);
    const newRoleLabel = getRoleDisplay(updates.role);
    const previousAssignment =
      editingUser?.section && editingUser.section !== "—"
        ? editingUser.section
        : editingUser?.division ?? "—";
    const newAssignment = updates.sectionName ?? updates.divisionName ?? "—";

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
      await logAuditEvent({
        action: "Other",
        fileName: editingUser?.name,
        details: `Failed to update user account (${editingUser?.email}): ${error.message}`,
        role: editingUser?.role,
        status: "Failed",
      });
      return;
    }

    if (userId === userProfile?.id) {
      await refreshProfile();
    }

    const changeParts = [];
    if (previousRoleLabel !== newRoleLabel) {
      changeParts.push(`Role changed from ${previousRoleLabel} to ${newRoleLabel}`);
    }
    if (previousAssignment !== newAssignment) {
      changeParts.push(`Assignment changed from ${previousAssignment} to ${newAssignment}`);
    }
    const details = changeParts.length ? changeParts.join("; ") : "No changes detected";

    await logAuditEvent({
      action: "Role Change",
      fileName: editingUser?.name,
      details,
      role: updates.role,
      status: "Success",
    });

    setToastMessage("User updated successfully.");
    setShowToast(true);
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

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId: deletingUser.id }),
      });

    const data = await res.json();
    if (!res.ok) {
      alert("Error deleting user: " + data.error);
      await logAuditEvent({
        action: "Delete",
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
    setToastMessage("User deleted successfully.");
    setShowToast(true);
    fetchUsers();
  };

  const handleAddNewUser = async (newUserData) => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: newUserData.email,
          full_name: newUserData.name,
          division_id: newUserData.divisionId,
          section_id: newUserData.sectionId,
          role: getRoleDisplay(newUserData.role),
          idNumber: newUserData.idNumber,
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      alert("Error: " + data.error);
      return;
    }

    await logAuditEvent({
      action: "Access Grant",
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
      await logAuditEvent({
        action: "Edit",
        fileName: deactivatingUser.name,
        details: `Failed to deactivate user account (${deactivatingUser.email}): ${error.message}`,
        role: deactivatingUser.role,
        status: "Failed",
      });
      return;
    }

    await logAuditEvent({
      action: "Edit",
      fileName: deactivatingUser.name,
      details: `Deactivated user account (${deactivatingUser.email})`,
      role: deactivatingUser.role,
      status: "Success",
    });

    setDeactivatingUser(null);
    setToastMessage("User deactivated successfully.");
    setShowToast(true);
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
      await logAuditEvent({
        action: "Edit",
        fileName: activatingUser.name,
        details: `Failed to activate user account (${activatingUser.email}): ${error.message}`,
        role: activatingUser.role,
        status: "Failed",
      });
      return;
    }

    await logAuditEvent({
      action: "Edit",
      fileName: activatingUser.name,
      details: `Activated user account (${activatingUser.email})`,
      role: activatingUser.role,
      status: "Success",
    });

    setActivatingUser(null);
    setToastMessage("User activated successfully.");
    setShowToast(true);
    fetchUsers();
  };

  // ─── Badge helpers ───────────────────────────────────────────
  const getRoleBadgeColor = (role) => {
    const display = getRoleDisplay(role);
    if (display.includes("Focal Person"))
      return "bg-purple-50 text-purple-600 border border-purple-100";
    if (display.includes("Officer"))
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (display.includes("Personnel"))
      return "bg-amber-50 text-amber-600 border border-amber-100";
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
      label: "DIVISION FOCAL PERSONS",
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
      label: "SECTION PERSONNELS",
      value: personnelCount,
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      icon: <Briefcase size={18} className="text-white" />,
    },
  ];

  // ─── UI ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full bg-slate-50/40 flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
          <p className="text-[0.78rem] font-semibold text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        {/* Toast Notification */}
        <div
          className={`fixed left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-50 flex bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 ${
            showToast
              ? "translate-y-0 sm:translate-x-0 opacity-100 pointer-events-auto"
              : "translate-y-4 sm:translate-y-0 sm:translate-x-[120%] opacity-0 pointer-events-none"
          }`}
          style={{
            maxWidth: "380px",
            marginLeft: "auto",
            height: "76px",
            borderRadius: "16px",
            boxShadow: showToast
              ? "0 4px 24px rgba(16, 185, 129, 0.25), 0 1px 3px rgba(0,0,0,0.05)"
              : "0 12px 30px rgba(0,0,0,0)",
            fontFamily: "Poppins, sans-serif",
            border: "1px solid rgba(241, 245, 249, 1)",
          }}
        >
          {/* Soft green background gradient on the left */}
          <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-emerald-100/60 to-transparent pointer-events-none" />

          {/* Content */}
          <div
            className="flex items-center flex-1 relative z-10"
            style={{ padding: "0 20px", gap: "16px" }}
          >
            {/* Icon Box */}
            <div
              className="flex items-center justify-center shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.03)]"
              style={{
                width: "42px",
                height: "42px",
              }}
            >
              <CheckCircle size={22} className="text-emerald-500" strokeWidth={2.5} />
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center">
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2, margin: 0 }}>
                Success
              </p>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginTop: "3px", margin: 0 }}>
                {toastMessage}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowToast(false)}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
              aria-label="Close notification"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
            <div>
              <h1 className="text-xl sm:text-[1.65rem] font-black text-slate-800 tracking-[-0.02em]">
                Manage Users
              </h1>
              <p className="hidden lg:block text-[0.78rem] text-slate-400 font-medium mt-1">
                Manage user accounts and access permissions
              </p>
            </div>

            <button
              id="manage-users-add-btn"
              type="button"
              onClick={() => setAddingNewUser(true)}
              className="hidden lg:inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] bg-blue-500 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,0.28)] hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer shrink-0"
            >
              <UserPlus size={15} />
              Add New User
            </button>
          </div>

          {/* ── Summary / Stat Cards Row ────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-7">
            {statCardsData.map((stat) => (
              <div
                key={stat.label}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:hover:-translate-y-[2px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div
                    className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ background: stat.gradient }}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-xl sm:text-[1.75rem] font-black text-slate-800 tracking-tight leading-none">
                    {stat.value}
                  </p>
                </div>
                <p className="text-[0.55rem] sm:text-[0.6rem] font-bold text-slate-400 uppercase tracking-[0.06em] sm:tracking-[0.08em] leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* ── Search & Filter Controls ─────────────────────── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 mb-5 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
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
                className="w-full min-h-[44px] rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2 text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="relative z-10 flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-[0.78rem] font-semibold text-slate-500 shrink-0">
                Division:
              </span>
              <div className="relative z-10 flex items-center flex-1 sm:flex-none min-w-0">
                <select
                  id="user-division-filter"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-200/80 bg-slate-50/50 pl-3.5 pr-8 py-2 text-[0.78rem] font-semibold text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-all appearance-none"
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
            <div className="space-y-7 sm:space-y-9">
              {Object.entries(groupedUsers)
                .sort(([a], [b]) => {
                  if (a === "Administrators") return -1;
                  if (b === "Administrators") return 1;
                  return a.localeCompare(b);
                })
                .map(([division, divisionUsers]) => (
                  <div key={division}>
                    <div className="flex items-baseline justify-between mb-3 sm:mb-4 pb-2 border-b border-slate-200/60 gap-3">
                      <h2 className="text-base sm:text-[1.1rem] font-bold text-slate-800 tracking-[-0.01em] truncate">
                        {division}
                      </h2>
                      <span className="text-[0.72rem] sm:text-[0.75rem] font-semibold text-slate-400 shrink-0">
                        {divisionUsers.length} {divisionUsers.length === 1 ? "user" : "users"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:flex lg:overflow-x-auto lg:gap-5 lg:pb-4 lg:[&::-webkit-scrollbar]:h-1.5 lg:[&::-webkit-scrollbar-track]:bg-slate-50 lg:[&::-webkit-scrollbar-thumb]:bg-slate-200 lg:hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:snap-x lg:snap-mandatory">
                      {divisionUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setViewingLogsUser(user)}
                          className="w-full lg:shrink-0 lg:w-[300px] lg:snap-start group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] lg:hover:-translate-y-[2px] cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-5 items-start">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-base sm:text-[1.1rem] shadow-sm">
                                {user.avatar}
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-[2.5px] border-white ${
                                  user.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                            </div>
                            <div className="flex flex-col pt-0.5 sm:pt-1 min-w-0 flex-1">
                              <h3 className="font-bold text-slate-800 text-[0.95rem] sm:text-[1rem] tracking-tight leading-tight truncate">
                                {user.name}
                              </h3>
                              <div className="mt-1.5 flex items-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[0.65rem] sm:text-[0.7rem] font-bold ${getRoleBadgeColor(
                                    user.role,
                                  )}`}
                                >
                                  {user.role === "division_focal" ? (
                                    <Shield size={10} className="shrink-0" />
                                  ) : (
                                    <UsersIcon size={10} className="shrink-0" />
                                  )}
                                  {getRoleDisplay(user.role)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col rounded-xl border border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3 px-3 py-2">
                              <Mail size={14} className="text-slate-400 shrink-0" />
                              <p className="text-[0.75rem] sm:text-[0.78rem] font-medium text-slate-600 truncate">
                                {user.email || "No email provided"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2">
                              <Building2 size={14} className="text-slate-400 shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[0.75rem] sm:text-[0.78rem] font-medium text-slate-600 truncate">
                                  {user.division}
                                </p>
                                {user.role !== "division_focal" &&
                                  user.section &&
                                  user.section !== "—" && (
                                    <>
                                      <span className="text-slate-300 shrink-0">•</span>
                                      <span className="text-[0.75rem] sm:text-[0.78rem] font-medium text-slate-600 truncate">
                                        {user.section}
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2">
                              <Hash size={14} className="text-slate-400 shrink-0" />
                              <p className="text-[0.75rem] sm:text-[0.78rem] font-medium text-slate-600 truncate">
                                User ID: {user.idNumber ?? "—"}
                              </p>
                            </div>
                          </div>

                          {/* Mobile / tablet: actions always visible */}
                          <div className="pt-3 sm:pt-4 flex items-center justify-between gap-2 lg:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUser(user);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 min-h-[40px] py-2 text-[0.75rem] font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Edit2 size={12} /> Edit
                            </button>

                            {user.status === "Inactive" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivatingUser(user);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 min-h-[40px] py-2 text-[0.75rem] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <UserCheck size={12} /> Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeactivatingUser(user);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 min-h-[40px] py-2 text-[0.75rem] font-bold text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                              >
                                <UserX size={12} /> Deactivate
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingUser(user);
                              }}
                              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Desktop: actions on hover */}
                          <div className="hidden lg:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                            <div className="overflow-hidden">
                              <div className="pt-4 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUser(user);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-blue-200 bg-blue-50 py-2 text-[0.75rem] font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>

                                {user.status === "Inactive" ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivatingUser(user);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-emerald-200 bg-emerald-50 py-2 text-[0.75rem] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    <UserCheck size={12} /> Activate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeactivatingUser(user);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-amber-200 bg-amber-50 py-2 text-[0.75rem] font-bold text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                                  >
                                    <UserX size={12} /> Deactivate
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingUser(user);
                                  }}
                                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
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

          {/* Mobile FAB — Add New User */}
          <button
            type="button"
            onClick={() => setAddingNewUser(true)}
            aria-label="Add New User"
            title="Add New User"
            className="lg:hidden fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-95 transition-all"
          >
            <UserPlus size={22} strokeWidth={2.25} />
          </button>
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