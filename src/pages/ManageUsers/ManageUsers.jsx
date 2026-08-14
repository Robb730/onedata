import { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Users as UsersIcon,
  UserCheck,
  Shield,
  Briefcase,
  Grid3x3,
  List,
  X,
  CheckCircle,
} from "lucide-react";
import OrganizationView from "../../components/ManageUsersComponents/OrganizationView";
import DirectoryFilterPills, {
  DirectoryActiveChips,
} from "../../components/ManageUsersComponents/DirectoryFilterPills";
import { userMatchesQuery } from "../../components/ManageUsersComponents/organizationStructure";
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
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("manage-users-view-mode") || "list",
  );
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
    localStorage.setItem("manage-users-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const roleDisplayMap = {
    division_focal: "Division Focal Person",
    section_focal: "Section Officer",
    section_personnel: "Section Personnel",
    administrator: "Administrator",
  };

  const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

  // ─── Divisions list for filter dropdown ──────────────────────
  const divisions = [
    "All",
    ...Array.from(new Set(users.map((u) => u.division))).filter(
      (d) => d !== "—",
    ),
  ];

  // ─── Filter (same `users` source; presentation-only) ─────────
  const filteredUsers = users.filter((user) => {
    const matchesSearch = userMatchesQuery(user, searchQuery, getRoleDisplay);
    const matchesDivision =
      selectedDivision === "All" || user.division === selectedDivision;
    const matchesRole =
      selectedRole === "All" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "All" || user.status === selectedStatus;
    return matchesSearch && matchesDivision && matchesRole && matchesStatus;
  });

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
      return "bg-blue-50 text-blue-600 border border-blue-100";
    return "bg-slate-100 text-slate-600 border border-slate-200/80";
  };

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
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8">
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
                Organizational directory of user accounts and access permissions
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 mb-5 sm:mb-8 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="user-search-input"
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-4 py-2 text-[0.8rem] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <DirectoryFilterPills
                divisions={divisions}
                selectedDivision={selectedDivision}
                onDivisionChange={setSelectedDivision}
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />

              <div className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  title="Grid view"
                  className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white"
                  }`}
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  title="List view"
                  className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-md transition-all ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            <DirectoryActiveChips
              selectedDivision={selectedDivision}
              onDivisionChange={setSelectedDivision}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>

          <OrganizationView
            users={filteredUsers}
            searchQuery={searchQuery}
            selectedDivision={selectedDivision}
            viewMode={viewMode}
            getRoleDisplay={getRoleDisplay}
            getRoleBadgeColor={getRoleBadgeColor}
            onViewLogs={setViewingLogsUser}
            onEdit={setEditingUser}
            onActivate={setActivatingUser}
            onDeactivate={setDeactivatingUser}
            onDelete={setDeletingUser}
          />

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
            className="mobile-fab lg:hidden fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-95 transition-all"
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