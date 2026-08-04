import { useState, useEffect } from "react";
import {
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  UserX,
  // eslint-disable-next-line no-unused-vars
  RefreshCw,
  Folder,
  FolderOpen,
  UserCheck,
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

  const { userProfile } = useUser();

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

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

  // ─── Group by division ───────────────────────────────────────
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const key = user.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  // ─── Handlers ────────────────────────────────────────────────
  // updates: { role, divisionId, sectionId } — division/section are already
  // scoped correctly by EditUserModal based on the selected role.
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
    fetchUsers();
  };

  // newUserData: { name, idNumber, email, role, divisionId, sectionId }
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

    // ─── Log this action to Audit Logs ─────────────────────────
    await logAuditEvent({
      action: "Other",
      fileName: newUserData.name,
      details: `Created new user account (${newUserData.email})`,
      role: newUserData.role,
      status: "Success",
    });

    setAddingNewUser(false);
    setSuccessEmail(newUserData.email);
    fetchUsers(); // refresh list from DB
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
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (display.includes("Officer"))
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (display.includes("Administrator"))
      return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  const roleDisplayMap = {
    division_focal: "Division Focal Person",
    section_focal: "Section Officer",
    section_personnel: "Section Personnel",
    administrator: "Administrator",
  };

  const getRoleDisplay = (role) => roleDisplayMap[role] ?? role;

  // ─── UI ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-500 mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <button
            onClick={() => setAddingNewUser(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <UserPlus size={18} />
            Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Users", value: users.length, color: "blue" },
          {
            label: "Focal Persons",
            value: users.filter((u) => u.role?.includes("Focal Person")).length,
            color: "purple",
          },
          {
            label: "Section Officers",
            value: users.filter((u) => u.role?.includes("Officer")).length,
            color: "teal",
          },
          {
            label: "Personnel",
            value: users.filter((u) => u.role?.includes("Personnel")).length,
            color: "orange",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center`}
              >
                <UsersIcon className={`text-${color}-600`} size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, ID, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Division:</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users grouped by Division */}
      <div className="space-y-8">
        {Object.entries(groupedUsers).map(([division, divisionUsers]) => (
          <div key={division}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{division}</h2>
              <span className="text-sm text-gray-500">
                {divisionUsers.length} users
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {divisionUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setViewingLogsUser(user)}
                >
                  {/* Status */}
                  <div className="flex justify-end mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(user.status)}`}
                    >
                      ● {user.status}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-2">
                      {user.avatar}
                    </div>
                    <h3 className="font-bold text-gray-900 text-center text-sm">
                      {user.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {user.idNumber ?? "—"}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FolderOpen size={13} className="text-indigo-500 shrink-0" />
                        <p className="text-xs font-bold text-gray-900 leading-snug">
                          {user.division}
                        </p>
                      </div>
                      {user.role !== "division_focal" && (
                        <div className="flex items-center gap-1 mt-1.5 ml-0.5">
                          <div className="w-1 h-1 rounded-full bg-indigo-300" />
                          <span className="inline-block text-[10.5px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                            {user.section}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}
                      >
                        {getRoleDisplay(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser(user);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors text-xs"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      {user.status === "Inactive" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivatingUser(user);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors text-xs"
                        >
                          <UserCheck size={12} /> Activate
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeactivatingUser(user);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 font-medium transition-colors text-xs"
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
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors text-xs"
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

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Modals */}
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
  );
}