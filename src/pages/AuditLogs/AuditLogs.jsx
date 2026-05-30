import { useState } from "react";
import { Search, Download, Filter, Calendar, FileText, CheckCircle, Upload, Trash2, Edit, UserPlus, Shield } from "lucide-react";

const auditLogs = [
  {
    id: "1",
    fileName: "Student Enrollment Data Q1.pdf",
    action: "Upload",
    performedBy: "Juan Dela Cruz",
    role: "Division Focal Person",
    performedOn: "Feb 24, 2026 10:30 AM",
    ipAddress: "192.168.1.101",
    details: "Uploaded to Planning and Research folder",
    status: "Success",
  },
  {
    id: "2",
    fileName: "Annual Implementation Plan.docx",
    action: "Verify",
    performedBy: "Hensley Santos",
    role: "Division Focal Person",
    performedOn: "Feb 24, 2026 09:15 AM",
    ipAddress: "192.168.1.105",
    details: "Document verified and approved",
    status: "Success",
  },
  {
    id: "3",
    fileName: "Teacher Performance Report.xlsx",
    action: "Download",
    performedBy: "Maria Santos",
    role: "Section Officer",
    performedOn: "Feb 24, 2026 08:45 AM",
    ipAddress: "192.168.1.112",
    details: "Downloaded from HRD folder",
    status: "Success",
  },
  {
    id: "4",
    fileName: "Budget Forecast 2026.xlsx",
    action: "Edit",
    performedBy: "Carlos Mendoza",
    role: "Section Officer",
    performedOn: "Feb 23, 2026 04:20 PM",
    ipAddress: "192.168.1.108",
    details: "Updated file metadata - School Year changed",
    status: "Success",
  },
  {
    id: "5",
    fileName: "N/A",
    action: "Role Change",
    performedBy: "Juan Dela Cruz",
    role: "Administrator",
    performedOn: "Feb 23, 2026 03:10 PM",
    ipAddress: "192.168.1.101",
    details: "Changed Pedro Santos role from Section Personnel to Section Officer",
    status: "Success",
  },
  {
    id: "6",
    fileName: "Research Proposal Template.docx",
    action: "Access Request",
    performedBy: "Anna Reyes",
    role: "Section Personnel",
    performedOn: "Feb 23, 2026 02:30 PM",
    ipAddress: "192.168.1.115",
    details: "Requested access to restricted document",
    status: "Pending",
  },
  {
    id: "7",
    fileName: "Policy Brief - Education Reform.pdf",
    action: "Access Grant",
    performedBy: "Juan Dela Cruz",
    role: "Administrator",
    performedOn: "Feb 23, 2026 01:45 PM",
    ipAddress: "192.168.1.101",
    details: "Granted access to Robbi Olano for restricted document",
    status: "Success",
  },
  {
    id: "8",
    fileName: "Old Survey Data 2020.pdf",
    action: "Delete",
    performedBy: "Juan Dela Cruz",
    role: "Administrator",
    performedOn: "Feb 23, 2026 11:20 AM",
    ipAddress: "192.168.1.101",
    details: "Permanently deleted outdated file",
    status: "Success",
  },
  {
    id: "9",
    fileName: "Strategic Plan 2026-2027.pdf",
    action: "Upload",
    performedBy: "Hensley Santos",
    role: "Division Focal Person",
    performedOn: "Feb 22, 2026 03:30 PM",
    ipAddress: "192.168.1.105",
    details: "Uploaded to Superintendent Office folder",
    status: "Success",
  },
  {
    id: "10",
    fileName: "DRRM Action Plan.docx",
    action: "Verify",
    performedBy: "Jose Martinez",
    role: "Section Officer",
    performedOn: "Feb 22, 2026 02:15 PM",
    ipAddress: "192.168.1.120",
    details: "Document verified and approved",
    status: "Success",
  },
  {
    id: "11",
    fileName: "School Health Assessment.pdf",
    action: "Download",
    performedBy: "Dr. Carmen Lopez",
    role: "Section Officer",
    performedOn: "Feb 22, 2026 01:00 PM",
    ipAddress: "192.168.1.125",
    details: "Downloaded from School Health folder",
    status: "Success",
  },
  {
    id: "12",
    fileName: "Corrupted_file.pdf",
    action: "Upload",
    performedBy: "Unknown User",
    role: "Unknown",
    performedOn: "Feb 22, 2026 10:30 AM",
    ipAddress: "192.168.1.200",
    details: "Upload failed - File corrupted",
    status: "Failed",
  },
];

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const actions = ["All", "Upload", "Download", "Verify", "Delete", "Edit", "Role Change", "Access Request", "Access Grant"];
  const statuses = ["All", "Success", "Failed", "Pending"];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getActionIcon = (action) => {
    switch (action) {
      case "Upload":
        return <Upload className="text-blue-600" size={16} />;
      case "Download":
        return <Download className="text-teal-600" size={16} />;
      case "Verify":
        return <CheckCircle className="text-green-600" size={16} />;
      case "Delete":
        return <Trash2 className="text-red-600" size={16} />;
      case "Edit":
        return <Edit className="text-orange-600" size={16} />;
      case "Role Change":
        return <UserPlus className="text-purple-600" size={16} />;
      case "Access Request":
        return <Shield className="text-yellow-600" size={16} />;
      case "Access Grant":
        return <Shield className="text-green-600" size={16} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "Upload":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Download":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Verify":
        return "bg-green-50 text-green-700 border-green-200";
      case "Delete":
        return "bg-red-50 text-red-700 border-red-200";
      case "Edit":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Role Change":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Access Request":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Access Grant":
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
        return "text-green-600";
      case "Failed":
        return "text-red-600";
      case "Pending":
        return "text-orange-600";
    }
  };

  const actionCounts = {
    Upload: auditLogs.filter((l) => l.action === "Upload").length,
    Download: auditLogs.filter((l) => l.action === "Download").length,
    Verify: auditLogs.filter((l) => l.action === "Verify").length,
    Other: auditLogs.filter((l) => !["Upload", "Download", "Verify"].includes(l.action)).length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Track all system activities and user actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Upload className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{actionCounts.Upload}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <Download className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{actionCounts.Download}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verifications</p>
              <p className="text-2xl font-bold text-gray-900">{actionCounts.Verify}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Other Actions</p>
              <p className="text-2xl font-bold text-gray-900">{actionCounts.Other}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by file name, user, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={18} />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action} {action !== "All" && "Actions"}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status} {status !== "All" && "Status"}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors inline-flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action Done On
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.fileName !== "N/A" && <FileText className="text-gray-400" size={16} />}
                      <span className="text-sm font-medium text-gray-900">{log.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{log.performedBy}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{log.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={12} />
                      <span>{log.performedOn}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{log.details}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-500">
          Showing {filteredLogs.length} of {auditLogs.length} logs
        </p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
            1
          </button>
          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            2
          </button>
          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            3
          </button>
          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}