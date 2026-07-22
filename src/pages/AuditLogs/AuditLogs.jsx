import { useState } from "react";
import {
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogsFooter,
} from "../../components/AuditLogsComponents";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const actions = [
    "All",
    "Upload",
    "Download",
    "Verify",
    "Delete",
    "Edit",
    "Role Change",
    "Access Request",
    "Access Grant",
  ];
  const statuses = ["All", "Success", "Failed", "Pending"];

  // No static data — logs will come from backend integration
  const auditLogs = [];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const actionCounts = {
    Upload: auditLogs.filter((l) => l.action === "Upload").length,
    Download: auditLogs.filter((l) => l.action === "Download").length,
    Verify: auditLogs.filter((l) => l.action === "Verify").length,
    Other: auditLogs.filter(
      (l) => !["Upload", "Download", "Verify"].includes(l.action)
    ).length,
  };

  return (
    <div className="p-6 sm:p-8">
      <AuditLogsHeader />

      <AuditLogsStats actionCounts={actionCounts} />

      <AuditLogsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterAction={filterAction}
        onFilterActionChange={setFilterAction}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        actions={actions}
        statuses={statuses}
      />

      <AuditLogsTable
        logs={filteredLogs}
        filteredCount={filteredLogs.length}
        totalCount={auditLogs.length}
      />

      <AuditLogsFooter
        shownCount={filteredLogs.length}
        totalCount={auditLogs.length}
      />
    </div>
  );
}
