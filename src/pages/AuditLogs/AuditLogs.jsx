import { useState, useEffect } from "react";
import {
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogsFooter,
} from "../../components/AuditLogsComponents";
import {supabase} from "../../lib/supabaseClient";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function formatPerformedOn(isoString) {
  if (!isoString) return { date: "—", time: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}
  

  useEffect(() => {
    let isMounted = true;

    async function fetchLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("performed_on", { ascending: false })
        .limit(200); // paginate/adjust as needed

      if (error) {
        console.error("Failed to fetch audit logs:", error);
      } else if (isMounted) {
        setAuditLogs(
          data.map((row) => ({
            id: row.id,
            action: row.action,
            fileName: row.file_name ?? "N/A",
            details: row.details ?? "",
            performedBy: row.performed_by,
            role: row.role,
            performedOn: row.performed_on,
            status: row.status,
          }))
        );
      }
      if (isMounted) setLoading(false);
    }

    fetchLogs();

    // Optional: live updates so new uploads appear without a refresh
    const channel = supabase
      .channel("audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const row = payload.new;
          setAuditLogs((prev) => [
            {
              id: row.id,
              action: row.action,
              fileName: row.file_name ?? "N/A",
              details: row.details ?? "",
              performedBy: row.performed_by,
              role: row.role,
              performedOn: row.performed_on,
              status: row.status,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
