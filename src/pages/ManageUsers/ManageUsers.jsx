import { useState } from "react";
import {
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  UserX,
  RefreshCw,
  UserCheck,
} from "lucide-react";  
import EditUserModal from "../../components/ManageUsersComponents/EditUserModal";
import DeleteConfirmationModal from "../../components/ManageUsersComponents/DeleteConfirmationModal";
import UserLogsModal from "../../components/ManageUsersComponents/UserLogsModal";
import AddNewUserModal from "../../components/ManageUsersComponents/AddNewUserModal";
import SuccessModal from "../../components/ManageUsersComponents/SuccessModal";
import DeactivateConfirmationModal from "../../components/ManageUsersComponents/DeactivateConfirmationModal";
import ActivateConfirmationModal from "../../components/ManageUsersComponents/ActivateConfirmationModal";

const initialUsers = [

  // Curriculum Implementation Division
  {
    id: "1",
    name: "Juan Reyes",
    idNumber: "SDO-2024-001",
    division: "Curriculum Implementation Division",
    role: "Division Focal Person",
    avatar: "JR",
    email: "juan.reyes@deped.gov.ph",
    status: "Active",
  },
  {
    id: "2",
    name: "Maria Clara",
    idNumber: "SDO-2024-002",
    division: "Curriculum Implementation Division",
    role: "Section Officer",
    avatar: "MC",
    email: "maria.clara@deped.gov.ph",
    status: "Active",
  },
  {
    id: "3",
    name: "Pedro Santos",
    idNumber: "SDO-2024-003",
    division: "Curriculum Implementation Division",
    role: "Section Personnel",
    avatar: "PS",
    email: "pedro.santos@deped.gov.ph",
    status: "Active",
  },

  // Office of the Schools Division Superintendent
  {
    id: "4",
    name: "Hensley Santos",
    idNumber: "SDO-2024-004",
    division: "Office of the Schools Division Superintendent",
    role: "Division Focal Person",
    avatar: "HS",
    email: "hensley.santos@deped.gov.ph",
    status: "Active",
  },
  {
    id: "5",
    name: "Anna Marie Reyes",
    idNumber: "SDO-2024-005",
    division: "Office of the Schools Division Superintendent",
    role: "Section Officer",
    avatar: "AR",
    email: "anna.reyes@deped.gov.ph",
    status: "Active",
  },

  // School Governance and Operations Division
  {
    id: "6",
    name: "Robbi Olano",
    idNumber: "SDO-2024-006",
    division: "School Governance and Operations Division",
    role: "Division Focal Person",
    avatar: "RO",
    email: "robbi.olano@deped.gov.ph",
    status: "Active",
  },
  {
    id: "7",
    name: "Carlos Mendoza",
    idNumber: "SDO-2024-007",
    division: "School Governance and Operations Division",
    role: "Section Officer",
    avatar: "CM",
    email: "carlos.mendoza@deped.gov.ph",
    status: "Active",
  },

  // Planning and Research
  {
    id: "8",
    name: "John Hatulan Santos",
    idNumber: "SDO-2024-008",
    division: "Planning and Research",
    role: "Section Officer",
    avatar: "JH",
    email: "john.santos@deped.gov.ph",
    status: "Active",
  },
  {
    id: "9",
    name: "Emilia Olano",
    idNumber: "SDO-2024-009",
    division: "Planning and Research",
    role: "Section Personnel",
    avatar: "EO",
    email: "emilia.olano@deped.gov.ph",
    status: "Active",
  },

  // HRD
  {
    id: "10",
    name: "Lisa Garcia",
    idNumber: "SDO-2024-010",
    division: "HRD",
    role: "Section Officer",
    avatar: "LG",
    email: "lisa.garcia@deped.gov.ph",
    status: "Active",
  },
  {
    id: "11",
    name: "Ramon Cruz",
    idNumber: "SDO-2024-011",
    division: "HRD",
    role: "Section Personnel",
    avatar: "RC",
    email: "ramon.cruz@deped.gov.ph",
    status: "Active",
  },

  // DRRM
  {
    id: "12",
    name: "Jose Martinez",
    idNumber: "SDO-2024-012",
    division: "DRRM",
    role: "Section Officer",
    avatar: "JM",
    email: "jose.martinez@deped.gov.ph",
    status: "Active",
  },

  // Education Facilities
  {
    id: "13",
    name: "Sofia Reyes",
    idNumber: "SDO-2024-013",
    division: "Education Facilities",
    role: "Section Officer",
    avatar: "SR",
    email: "sofia.reyes@deped.gov.ph",
    status: "Active",
  },
  {
    id: "14",
    name: "Miguel Torres",
    idNumber: "SDO-2024-014",
    division: "Education Facilities",
    role: "Section Personnel",
    avatar: "MT",
    email: "miguel.torres@deped.gov.ph",
    status: "Active",
  },

  // School Health
  {
    id: "15",
    name: "Dr. Carmen Lopez",
    idNumber: "SDO-2024-015",
    division: "School Health",
    role: "Section Officer",
    avatar: "CL",
    email: "carmen.lopez@deped.gov.ph",
    status: "Active",
  },

  // Sports
  {
    id: "16",
    name: "Juan Paola",
    idNumber: "SDO-2024-016",
    division: "Sports",
    role: "Section Officer",
    avatar: "JP",
    email: "juan.paola@deped.gov.ph",
    status: "Active",
  },
];

export default function ManageUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [viewingLogsUser, setViewingLogsUser] = useState(null);
  const [addingNewUser, setAddingNewUser] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [activatingUser, setActivatingUser] = useState(null);

  // Get unique divisions for filtering
  const divisions = [
    "All",
    ...Array.from(new Set(users.map((u) => u.division))),
  ];

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.idNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.division
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesDivision =
      selectedDivision === "All" ||
      user.division === selectedDivision;
    return matchesSearch && matchesDivision;
  });

  // Group users by division
  const groupedUsers = filteredUsers.reduce(
    (acc, user) => {
      if (!acc[user.division]) {
        acc[user.division] = [];
      }
      acc[user.division].push(user);
      return acc;
    },
    {},
  );

  // Uses the contents of the EditUserModal.jsx file
  const handleEditUser = (userId, updates) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user,
      ),
    );
  };

  // Uses the contents of the DeleteConfirmationModal.jsx file
  const handleDeleteUser = () => {
    if (deletingUser) {
      setUsers(users.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    }
  };

  // Uses the contents of the AddNewUserModal.jsx file
  const handleAddNewUser = (newUserData) => {
    const newUser = {
      id: String(users.length + 1),
      ...newUserData,
      avatar: newUserData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      status: "Pending",
    };
    setUsers([...users, newUser]);
    setAddingNewUser(false);
    setSuccessEmail(newUser.email);
  };

  // Uses the contents of the DeactivateConfirmationModal.jsx file
  const handleDeactivateUser = () => {
    if (deactivatingUser) {
      setUsers(
        users.map((u) =>
          u.id === deactivatingUser.id
            ? { ...u, status: "Inactive" }
            : u,
        ),
      );
      setDeactivatingUser(null);
    }
  };

  // Uses the contents of the ActivateConfirmationModal.jsx file
  const handleActivateUser = () => {
    if (activatingUser) {
      setUsers(
        users.map((u) =>
          u.id === activatingUser.id
            ? { ...u, status: "Active" }
            : u,
        ),
      );
      setActivatingUser(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    if (role.includes("Focal Person"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (role.includes("Officer"))
      return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Users
            </h1>
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
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Total Users
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {users.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <UsersIcon
                className="text-purple-600"
                size={20}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Focal Persons
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  users.filter((u) =>
                    u.role.includes("Focal Person"),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Section Officers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  users.filter((u) =>
                    u.role.includes("Officer"),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <UsersIcon
                className="text-orange-600"
                size={20}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Personnel</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  users.filter((u) =>
                    u.role.includes("Personnel"),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, ID, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Division:
            </span>
            <select
              value={selectedDivision}
              onChange={(e) =>
                setSelectedDivision(e.target.value)
              }
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

      {/* Users by Division */}
      <div className="space-y-8">
        {Object.entries(groupedUsers).map(
          ([division, divisionUsers]) => (
            <div key={division}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {division}
                </h2>
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
                    onDoubleClick={() =>
                      setViewingLogsUser(user)
                    }
                  >
                    {/* Status Badge - Top Right */}
                    <div className="flex justify-end mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(user.status)}`}
                      >
                        ● {user.status}
                      </span>
                    </div>

                    {/* Profile Picture */}
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-2">
                        {user.avatar}
                      </div>
                      <h3 className="font-bold text-gray-900 text-center text-sm">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {user.idNumber}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500 mb-1">
                          Division/Section
                        </p>
                        <p className="text-xs font-semibold text-gray-900 leading-tight">
                          {user.division}
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUser(user);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors text-xs"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        {user.status === "Inactive" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivatingUser(user);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors text-xs"
                          >
                            <UserCheck size={12} />
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeactivatingUser(user);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 font-medium transition-colors text-xs"
                          >
                            <UserX size={12} />
                            Deactivate
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
                        <Trash2 size={12} />
                        Delete User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersIcon
            className="mx-auto text-gray-400 mb-4"
            size={48}
          />
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

