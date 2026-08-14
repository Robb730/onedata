import { useState } from "react";
import { X, Upload, Download, CheckCircle, Trash2, Edit, Shield, FileText, Calendar, Activity } from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";

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
    <div
      className="fixed inset-x-0 bottom-0 top-14 lg:inset-0 z-[100] flex items-end lg:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 lg:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl lg:rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.15)] w-full max-w-5xl max-h-[calc(100dvh-3.5rem)] lg:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 border-b-0 lg:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-2.5 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-7 py-4 sm:py-6 border-b border-slate-100 bg-white shrink-0 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm sm:text-[1.1rem] shadow-sm shrink-0">
              {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight leading-tight truncate">
                {user.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 sm:mt-1.5 flex-wrap">
                <span className="px-2 sm:px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[0.65rem] sm:text-[0.7rem] font-bold">
                  {user.role}
                </span>
                <span className="text-[0.72rem] sm:text-[0.8rem] font-medium text-slate-400 truncate">
                  {user.division}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 px-4 sm:px-7 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total</p>
              <p className="text-xl font-black text-slate-700 leading-none">{totalActions}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <Upload size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Uploads</p>
              <p className="text-xl font-black text-slate-700 leading-none">{actionCounts.Upload}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center shrink-0">
              <Download size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Downloads</p>
              <p className="text-xl font-black text-slate-700 leading-none">{actionCounts.Download}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
              <CheckCircle size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Verifies</p>
              <p className="text-xl font-black text-slate-700 leading-none">{actionCounts.Verify}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Edit size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Edits</p>
              <p className="text-xl font-black text-slate-700 leading-none">{actionCounts.Edit}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="px-4 sm:px-7 py-3 sm:py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-[0.8rem] font-bold text-slate-700 shrink-0">Filter by Action:</label>
            <div className="relative w-full sm:w-[180px] z-[50]">
              <CustomDropdown
                value={filterAction}
                onChange={setFilterAction}
                options={[
                  { value: "All", label: "All Actions" },
                  { value: "Upload", label: "Upload" },
                  { value: "Download", label: "Download" },
                  { value: "Verify", label: "Verify" },
                  { value: "Edit", label: "Edit" },
                  { value: "Delete", label: "Delete" },
                  { value: "Access Request", label: "Access Request" }
                ]}
                className="bg-white"
              />
            </div>
            <span className="sm:ml-auto text-[0.75rem] sm:text-[0.8rem] font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full text-center sm:text-left">
              Showing <span className="font-bold text-slate-700">{filteredLogs.length}</span> of {totalActions} activities
            </span>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto bg-slate-50/30 min-h-0">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                <FileText className="text-slate-400" size={28} />
              </div>
              <p className="text-slate-700 font-bold text-[0.9rem]">No activity logs found</p>
              <p className="text-[0.8rem] text-slate-500 mt-1 text-center">This user hasn&apos;t performed any actions yet</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="lg:hidden p-3 sm:p-4 space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                      <span className={`text-[0.72rem] font-bold flex items-center gap-1 shrink-0 ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{log.fileName}</p>
                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1 truncate">{log.folder}</p>
                    <p className="text-[0.72rem] text-slate-400 mt-2 flex items-center gap-1">
                      <Calendar size={12} />
                      {log.timestamp}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden lg:table w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm shadow-slate-100/50">
                <tr className="border-b border-slate-200/80">
                  <th className="px-7 py-3 text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-7 py-3 text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                  <th className="px-7 py-3 text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Folder</th>
                  <th className="px-7 py-3 text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-7 py-3 text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-7 py-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-bold border ${getActionColor(
                          log.action
                        )} shadow-sm`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-7 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-500 group-hover:scale-110 transition-transform">
                          <FileText size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-[0.85rem] font-bold text-slate-800">{log.fileName}</span>
                      </div>
                    </td>
                    <td className="px-7 py-4 align-middle">
                      <span className="inline-block text-[0.8rem] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-md">{log.folder}</span>
                    </td>
                    <td className="px-7 py-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[0.8rem] font-medium text-slate-500">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-7 py-4 align-middle">
                      <span className={`text-[0.8rem] font-bold flex items-center gap-1.5 ${getStatusColor(log.status)}`}>
                        {log.status === "Success" && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {log.status === "Pending" && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                        {log.status === "Failed" && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-7 py-4 sm:py-5 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-slate-900 text-white rounded-[10px] hover:bg-slate-800 hover:shadow-md font-bold text-[0.85rem] transition-all"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
}
