import { useState, useEffect } from "react";
import {
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogsFooter,
} from "../../components/AuditLogsComponents";
import { supabase } from "../../lib/supabaseClient";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

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

  // Export Logs Button Functionality
  function handleExport() {
    const rows = auditLogs.map((log) => {
      const { date, time } = formatPerformedOn(log.performedOn);
      const statusColor =
        log.status === "Success" ? "#16a34a" :
          log.status === "Failed" ? "#dc2626" :
            "#d97706";
      return `
      <tr>
        <td>${log.action}</td>
        <td>${log.fileName}</td>
        <td>${log.performedBy}</td>
        <td>${log.role}</td>
        <td>${date} ${time}</td>
        <td><span class="status-badge" style="background:${statusColor}1a; color:${statusColor};">${log.status}</span></td>
      </tr>`;
    }).join("");

    const html = `
    <html>
      <head>
        <title>Audit Logs Export</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 32px;
            margin: 0;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 12px;
            padding: 24px 28px;
            color: #ffffff;
            margin-bottom: 24px;
          }
          .header h1 {
            font-size: 20px;
            margin: 0 0 4px 0;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          .header p {
            font-size: 12.5px;
            margin: 0;
            color: #e0e7ff;
          }
          .card {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            background: #0f172a;
            color: #ffffff;
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 12px 14px;
            text-align: left;
            font-weight: 600;
          }
          tbody td {
            padding: 11px 14px;
            font-size: 12.5px;
            color: #1e293b;
            border-bottom: 1px solid #f1f5f9;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          tbody tr:hover {
            background: #f1f5f9;
          }
          .status-badge {
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
          }
          .footer {
            margin-top: 18px;
            font-size: 11px;
            color: #94a3b8;
            text-align: right;
          }
          @media print {
            body { background: #ffffff; padding: 12px; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OneData: Audit Logs</h1>
          <p>Exported on ${new Date().toLocaleString()} • ${auditLogs.length} record(s)</p>
        </div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Action</th><th>File Name</th><th>Performed By</th>
                <th>Role</th><th>Performed On</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </body>
    </html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  }

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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, filterStatus]);

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

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const actionCounts = {
    Upload: auditLogs.filter((l) => l.action === "Upload").length,
    Download: auditLogs.filter((l) => l.action === "Download").length,
    Verify: auditLogs.filter((l) => l.action === "Verify").length,
    Other: auditLogs.filter(
      (l) => !["Upload", "Download", "Verify"].includes(l.action)
    ).length,
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-10 py-8">
      <AuditLogsHeader onExport={handleExport} />

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
        logs={paginatedLogs}
        filteredCount={filteredLogs.length}
        totalCount={auditLogs.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AuditLogsFooter
        shownCount={filteredLogs.length}
        totalCount={auditLogs.length}
      />
      </div>
    </div>
  );
}
