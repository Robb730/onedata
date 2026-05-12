import { useState } from "react";
import { X, Upload, Download, CheckCircle, Trash2, Edit, Shield, FileText, Calendar } from "lucide-react";

// Sample logs data - in a real app, this would be fetched based on the user
const getUserLogs = (userName) => {
  const allLogs = {
    "Juan Dela Cruz": [
      {
        id: "1",
        action: "Upload",
        fileName: "Student Enrollment Data Q1.pdf",
        folder: "Planning and Research",
        timestamp: "Feb 24, 2026 10:30 AM",
        ipAddress: "192.168.1.101",
        details: "Uploaded new enrollment data",
        status: "Success",
      },
      {
        id: "2",
        action: "Edit",
        fileName: "Annual Implementation Plan.docx",
        folder: "Planning and Research",
        timestamp: "Feb 23, 2026 02:15 PM",
        ipAddress: "192.168.1.101",
        details: "Updated document metadata",
        status: "Success",
      },
      {
        id: "3",
        action: "Download",
        fileName: "Budget Forecast 2026.xlsx",
        folder: "School Governance and Operations Division",
        timestamp: "Feb 22, 2026 09:45 AM",
        ipAddress: "192.168.1.101",
        details: "Downloaded budget report",
        status: "Success",
      },
      {
        id: "4",
        action: "Delete",
        fileName: "Old Survey Data 2020.pdf",
        folder: "Planning and Research",
        timestamp: "Feb 21, 2026 11:20 AM",
        ipAddress: "192.168.1.101",
        details: "Removed outdated file",
        status: "Success",
      },
      {
        id: "5",
        action: "Access Request",
        fileName: "Confidential Report.pdf",
        folder: "Office of the Schools Division Superintendent",
        timestamp: "Feb 20, 2026 03:30 PM",
        ipAddress: "192.168.1.101",
        details: "Requested access to restricted document",
        status: "Pending",
      },
    ],
    "Hensley Santos": [
      {
        id: "1",
        action: "Verify",
        fileName: "Annual Implementation Plan.docx",
        folder: "Planning and Research",
        timestamp: "Feb 24, 2026 09:15 AM",
        ipAddress: "192.168.1.105",
        details: "Document verified and approved",
        status: "Success",
      },
      {
        id: "2",
        action: "Upload",
        fileName: "Strategic Plan 2026-2027.pdf",
        folder: "Office of the Schools Division Superintendent",
        timestamp: "Feb 22, 2026 03:30 PM",
        ipAddress: "192.168.1.105",
        details: "Uploaded strategic planning document",
        status: "Success",
      },
      {
        id: "3",
        action: "Download",
        fileName: "Teacher Performance Report.xlsx",
        folder: "HRD",
        timestamp: "Feb 21, 2026 01:45 PM",
        ipAddress: "192.168.1.105",
        details: "Downloaded performance metrics",
        status: "Success",
      },
    ],
    "Maria Santos": [
      {
        id: "1",
        action: "Download",
        fileName: "Teacher Performance Report.xlsx",
        folder: "HRD",
        timestamp: "Feb 24, 2026 08:45 AM",
        ipAddress: "192.168.1.112",
        details: "Downloaded HR report",
        status: "Success",
      },
      {
        id: "2",
        action: "Upload",
        fileName: "Employee Records Update.docx",
        folder: "HRD",
        timestamp: "Feb 23, 2026 02:30 PM",
        ipAddress: "192.168.1.112",
        details: "Uploaded updated employee records",
        status: "Success",
      },
      {
        id: "3",
        action: "Edit",
        fileName: "Staff Directory 2026.pdf",
        folder: "HRD",
        timestamp: "Feb 22, 2026 11:15 AM",
        ipAddress: "192.168.1.112",
        details: "Updated staff contact information",
        status: "Success",
      },
    ],
  };

  return allLogs[userName] || [];
};
export default function UserLogsModal({ isOpen, onClose, user }) {
  const [filterAction, setFilterAction] = useState("All");
  const logs = getUserLogs(user.name);

  const filteredLogs = filterAction === "All" 
    ? logs 
    : logs.filter(log => log.action === filterAction);

  if (!isOpen) return null;

  const getActionIcon = (action) => {
    switch (action) {
      case "Upload":
        return <Upload className="text-blue-600" size={14} />;
      case "Download":
        return <Download className="text-teal-600" size={14} />;
      case "Verify":
        return <CheckCircle className="text-green-600" size={14} />;
      case "Delete":
        return <Trash2 className="text-red-600" size={14} />;
      case "Edit":
        return <Edit className="text-orange-600" size={14} />;
      case "Access Request":
        return <Shield className="text-yellow-600" size={14} />;
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
      case "Access Request":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
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
    Upload: logs.filter((l) => l.action === "Upload").length,
    Download: logs.filter((l) => l.action === "Download").length,
    Verify: logs.filter((l) => l.action === "Verify").length,
    Edit: logs.filter((l) => l.action === "Edit").length,
    Delete: logs.filter((l) => l.action === "Delete").length,
  };

  const totalActions = logs.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                {user.role}
              </span>
              <span className="text-sm text-gray-500">{user.division}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 p-6 border-b border-gray-200 bg-gray-50">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Actions</p>
            <p className="text-xl font-bold text-gray-900">{totalActions}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Uploads</p>
            <p className="text-xl font-bold text-blue-600">{actionCounts.Upload}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Downloads</p>
            <p className="text-xl font-bold text-teal-600">{actionCounts.Download}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Verifications</p>
            <p className="text-xl font-bold text-green-600">{actionCounts.Verify}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Edits</p>
            <p className="text-xl font-bold text-orange-600">{actionCounts.Edit}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filter by Action:</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Actions</option>
              <option value="Upload">Upload</option>
              <option value="Download">Download</option>
              <option value="Verify">Verify</option>
              <option value="Edit">Edit</option>
              <option value="Delete">Delete</option>
              <option value="Access Request">Access Request</option>
            </select>
            <span className="ml-auto text-sm text-gray-500">
              Showing {filteredLogs.length} of {totalActions} activities
            </span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">No activity logs found</p>
              <p className="text-sm text-gray-400 mt-1">This user hasn't performed any actions yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timestamp
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
                        <FileText className="text-gray-400" size={16} />
                        <span className="text-sm font-medium text-gray-900">{log.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{log.folder}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar size={12} />
                        <span>{log.timestamp}</span>
                      </div>
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
