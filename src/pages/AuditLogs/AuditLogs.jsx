import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const actions = [
    "All",
    "Upload",
    "Download",
    "Verify",
    "Create",
    "Delete",
    "Edit",
    "Role Change",
    "Access Request",
    "Access Grant",
    "Login Success",
    "Login Failed",
    "Security Alert",
  ];
  const statuses = ["All", "Success", "Failed", "Pending"];

  // Export Logs Button Functionality
  function handleExport() {
    const rows = auditLogs.map((log) => {
      const { date, time } = formatPerformedOn(log.performedOn);
      const statusColor =
        log.status === "Success" || log.status === "Login Success" ? "#059669" :
          log.status === "Failed" ? "#dc2626" :
            "#d97706";
      const statusBg =
        log.status === "Success" || log.status === "Login Success" ? "#ecfdf5" :
          log.status === "Failed" ? "#fef2f2" :
            "#fffbeb";
      return `
      <tr>
        <td><span class="action-badge">${log.action}</span></td>
        <td class="file-cell">${log.fileName}</td>
        <td>${log.performedBy}</td>
        <td><span class="role-badge">${log.role}</span></td>
        <td class="date-cell">${date}<br/><span class="time-text">${time}</span></td>
        <td><span class="status-badge" style="background:${statusBg}; color:${statusColor};">${log.status}</span></td>
      </tr>`;
    }).join("");

    const successCount = auditLogs.filter((l) => l.status === "Success" || l.status === "Login Success").length;
    const failedCount = auditLogs.filter((l) => l.status === "Failed").length;
    const pendingCount = auditLogs.filter((l) => l.status === "Pending").length;

    const html = `
    <html>
      <head>
        <title>OneData: Audit Logs Export</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 36px;
            margin: 0;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 16px;
            padding: 28px 32px;
            color: #ffffff;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-left h1 {
            font-size: 22px;
            margin: 0 0 4px 0;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .header-left p {
            font-size: 12.5px;
            margin: 0;
            color: #e0e7ff;
            font-weight: 500;
          }
          .header-right {
            text-align: right;
          }
          .header-right .badge {
            display: inline-block;
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 999px;
            padding: 5px 14px;
            font-size: 11.5px;
            font-weight: 700;
          }
          .summary-row {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
          }
          .summary-card {
            flex: 1;
            background: #ffffff;
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #f1f5f9;
          }
          .summary-card .value {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1;
          }
          .summary-card .label {
            font-size: 10.5px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 5px;
          }
          .summary-card.success .value { color: #059669; }
          .summary-card.failed .value { color: #dc2626; }
          .summary-card.pending .value { color: #d97706; }
          .card {
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
            border: 1px solid #f1f5f9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            background: #0f172a;
            color: #ffffff;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 13px 14px;
            text-align: left;
            font-weight: 700;
          }
          tbody td {
            padding: 12px 14px;
            font-size: 12.5px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          .file-cell {
            font-weight: 600;
            color: #1e293b;
          }
          .date-cell {
            white-space: nowrap;
            font-weight: 500;
          }
          .time-text {
            color: #94a3b8;
            font-size: 11px;
          }
          .action-badge {
            display: inline-block;
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #dbeafe;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          .role-badge {
            display: inline-block;
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 11px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
          }
          .footer {
            margin-top: 16px;
            font-size: 11px;
            color: #94a3b8;
            text-align: right;
            font-weight: 500;
          }
          @media print {
            body { background: #ffffff; padding: 14px; }
            .header, thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .summary-card, .status-badge, .action-badge, .role-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tbody tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>OneData: Audit Logs</h1>
            <p>Exported on ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
          </div>
          <div class="header-right">
            <span class="badge">${auditLogs.length} record${auditLogs.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-card">
            <div class="value">${auditLogs.length}</div>
            <div class="label">Total Logs</div>
          </div>
          <div class="summary-card success">
            <div class="value">${successCount}</div>
            <div class="label">Success</div>
          </div>
          <div class="summary-card failed">
            <div class="value">${failedCount}</div>
            <div class="label">Failed</div>
          </div>
          <div class="summary-card pending">
            <div class="value">${pendingCount}</div>
            <div class="label">Pending</div>
          </div>
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

        <div class="footer">OneData: Confidential Audit Record</div>
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
  }, [searchQuery, filterAction, filterStatus, dateFrom, dateTo]);

  const queryClient = useQueryClient();
  const { data: auditLogsData } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("performed_on", { ascending: false })
        .limit(200);

      if (error) throw error;
      
      return data.map((row) => ({
        id: row.id,
        action: row.action,
        fileName: row.file_name ?? "N/A",
        details: row.details ?? "",
        performedBy: row.performed_by,
        role: row.role,
        performedOn: row.performed_on,
        status: row.status,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const auditLogs = auditLogsData || [];

  useEffect(() => {
    // Optional: live updates so new uploads (and security alerts) appear
    // without a refresh
    const channel = supabase
      .channel("audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const row = payload.new;
          queryClient.setQueryData(["auditLogs"], (prev) => [
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
            ...(prev || []),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ─── Handle "Deactivate" action on a Security Alert row ───────
  // Security Alert logs store the offending account's email in
  // `performed_by`. This looks the user up by email and deactivates them,
  // then marks the alert as resolved (Success) so it stops standing out
  // as Pending.
  // ─── Handle "Review" action on a Security Alert row ───────
// Security Alert logs store the offending account's email in
// `performed_by`. With auto-deactivation now handling the lockout
// itself at login time, this button is a fallback/review action:
// it deactivates the account only if it isn't already inactive,
// then marks the alert as reviewed so it stops standing out as Pending.
async function handleDeactivateFromAlert(log) {
  const confirmed = window.confirm(
    `Review security alert for ${log.performedBy}? If the account is still active, it will be deactivated until an administrator reactivates it.`
  );
  if (!confirmed) return;

  const { data: userRow, error: lookupError } = await supabase
    .from("users")
    .select("id, full_name, role, is_active")
    .eq("email", log.performedBy)
    .maybeSingle();

  if (lookupError || !userRow) {
    alert(
      "Could not find a matching user account for " +
        log.performedBy +
        (lookupError ? `: ${lookupError.message}` : "."),
    );
    return;
  }

  // Only deactivate if it isn't already locked (e.g. auto-lockout already handled it)
  if (userRow.is_active) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userRow.id);

    if (updateError) {
      alert("Error deactivating user: " + updateError.message);
      return;
    }

    await supabase.from("audit_logs").insert({
      action: "Edit",
      file_name: userRow.full_name,
      details: `Deactivated user account (${log.performedBy}) in response to a security alert.`,
      performed_by: "Administrator",
      role: userRow.role,
      status: "Success",
    });
  }

  // Mark the alert itself as reviewed
  const resolutionNote = userRow.is_active
    ? " — Account deactivated."
    : " — Reviewed (account already deactivated).";

  await supabase
    .from("audit_logs")
    .update({ status: "Success", details: `${log.details}${resolutionNote}` })
    .eq("id", log.id);

  queryClient.setQueryData(["auditLogs"], (prev) =>
    (prev || []).map((l) =>
      l.id === log.id
        ? { ...l, status: "Success", details: `${l.details}${resolutionNote}` }
        : l,
    ),
  );
}

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const logDate = new Date(log.performedOn);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) matchesDate = false;
      }
      if (dateTo && matchesDate) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) matchesDate = false;
      }
    }

    return matchesSearch && matchesAction && matchesStatus && matchesDate;
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
    <div className="min-h-full overflow-x-hidden bg-slate-50/40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
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
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={(range) => {
            setDateFrom(range.startDate);
            setDateTo(range.endDate);
          }}
        />

        <AuditLogsTable
          logs={paginatedLogs}
          filteredCount={filteredLogs.length}
          totalCount={auditLogs.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onDeactivateFromAlert={handleDeactivateFromAlert}
        />

        <AuditLogsFooter
          shownCount={filteredLogs.length}
          totalCount={auditLogs.length}
        />

        {/* Mobile FAB — Export Logs */}
        <button
          type="button"
          onClick={handleExport}
          aria-label="Export Logs"
          title="Export Logs"
          className="lg:hidden fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Download size={22} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}